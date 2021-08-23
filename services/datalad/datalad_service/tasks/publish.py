import asyncio
import logging
import os.path
import subprocess
import re

import pygit2
import boto3
from github import Github

import datalad_service.common.s3
from datalad_service.config import DATALAD_GITHUB_ORG
from datalad_service.config import DATALAD_GITHUB_LOGIN
from datalad_service.config import DATALAD_GITHUB_PASS
from datalad_service.config import DATALAD_GITHUB_EXPORTS_ENABLED
from datalad_service.config import AWS_ACCESS_KEY_ID
from datalad_service.config import AWS_SECRET_ACCESS_KEY
from datalad_service.common.annex import get_tag_info
from datalad_service.common.openneuro import clear_dataset_cache
from datalad_service.common.git import git_show, git_tag
from datalad_service.common.github import create_sibling_github
from datalad_service.common.s3 import DatasetRealm, s3_export, get_s3_realm
from datalad_service.common.s3 import update_s3_sibling
from datalad_service.common.elasticsearch import ReexportLogger


logger = logging.getLogger('datalad_service.' + __name__)


def create_github_repo(dataset_path, dataset_id):
    """Setup a github sibling / remote."""
    try:
        # raise exception if github exports are not enabled
        if not DATALAD_GITHUB_EXPORTS_ENABLED:
            raise Exception(
                'DATALAD_GITHUB_EXPORTS_ENABLED must be defined to create remote repos')

        # this adds github remote to config and also creates repo
        return create_sibling_github(dataset_path, dataset_id)
    except KeyError:
        raise Exception(
            'DATALAD_GITHUB_LOGIN, DATALAD_GITHUB_PASS, and DATALAD_GITHUB_ORG must be defined to create remote repos')


def github_sibling(dataset_path, dataset_id, siblings):
    """
    Find a GitHub remote or create a new repo and configure the remote.
    """
    try:
        return siblings['github']
    except KeyError:
        create_github_repo(dataset_path, dataset_id)
        return siblings['github']


def s3_sibling(dataset_path, siblings, realm=DatasetRealm.PRIVATE):
    """
    Setup a special remote for a versioned S3 remote.

    The bucket must already exist and be configured.
    """
    try:
        return siblings[realm.s3_remote]
    except KeyError:
        datalad_service.common.s3.setup_s3_sibling(dataset_path, realm)
        return siblings[realm.s3_remote]


def github_export(dataset, target):
    """
    Publish GitHub repo and tags.
    """
    dataset.publish(to=target)
    subprocess.check_call(
        ['git', 'push', '--tags', target], cwd=dataset.path)


def publish_target(dataset, target, treeish):
    """
    Publish target of dataset.

    This exists so the actual publish can be easily mocked.
    """
    if target == 'github':
        return github_export(dataset, target)
    else:
        return s3_export(dataset, target, treeish)


def get_dataset_realm(siblings, realm=None):
    # if realm parameter is not included, find the best target
    if realm is None:
        # if the dataset has a public sibling, use this as the export target
        # otherwise, use the private as the export target
        public_bucket_name = DatasetRealm(DatasetRealm.PUBLIC).s3_remote
        try:
            has_public_bucket = siblings[public_bucket_name]
            realm = DatasetRealm(DatasetRealm.PUBLIC)
        except KeyError:
            realm = DatasetRealm(DatasetRealm.PRIVATE)
    else:
        realm = get_s3_realm(realm=realm)
    return realm


async def publish_dataset(dataset_path, cookies=None, realm='PUBLIC'):
    def get_realm():
        return get_s3_realm(realm=realm)

    def should_export():
        return True
    export_all_tags(dataset_path, cookies, get_realm, should_export)


def reexport_dataset(dataset_path, cookies=None, realm=None):
    def get_realm(siblings):
        return get_dataset_realm(siblings, realm)

    def should_export(dataset_path, tags):
        latest_tag = tags[-1:][0]
        # If remote has latest snapshot, do not reexport.
        # Reexporting all snapshots could make a previous snapshot latest in s3.
        return not check_remote_has_version(dataset_path, DatasetRealm.PUBLIC.s3_remote, latest_tag)
    # logs to elasticsearch
    esLogger = ReexportLogger(dataset_path)
    export_all_tags(dataset_path, cookies,
                    get_realm, should_export, esLogger)


def publish_snapshot(dataset_path, cookies=None, snapshot=None, realm=None):
    def get_realm(siblings):
        return get_dataset_realm(siblings, realm)

    def should_export(ds, tags):
        return True
    export_all_tags(dataset_path, cookies, get_realm, should_export)


async def export_all_tags(dataset_path, cookies, get_realm, check_should_export, esLogger=None):
    """Migrate a dataset and all snapshots to an S3 bucket"""
    dataset = os.path.basename(dataset_path)
    repo = pygit2.Repository(dataset_path)
    tags = git_tag(repo)
    siblings = repo.remotes
    realm = get_realm(siblings)
    s3_sibling(dataset_path, siblings, realm=realm)
    if check_should_export(dataset_path, tags):
        for tag in tags:
            s3_export_successful = False
            github_export_successful = False
            error = None
            try:
                publish_target(dataset_path, realm.s3_remote, tag)
                await asyncio.sleep(0)
                s3_export_successful = True
                # Public publishes to GitHub
                if realm == DatasetRealm.PUBLIC and DATALAD_GITHUB_EXPORTS_ENABLED:
                    github_sibling(dataset_path, dataset_id, siblings)
                    publish_target(dataset_path, realm.github_remote, tag)
                    await asyncio.sleep(0)
                    github_export_successful = True
            except Exception as err:
                error = err
            finally:
                if esLogger:
                    esLogger.log(tag, s3_export_successful,
                                 github_export_successful, error)
        clear_dataset_cache(dataset, cookies)


def check_remote_has_version(dataset_path, remote, tag):
    try:
        info = get_tag_info(dataset_path, tag)
        remotes = info.get('repositories containing these files', [])
        remote_repo = [r for r in remotes if r.get(
            'description') == f'[{remote}]']
        remote_id_A = remote_repo and remote_repo[0].get('uuid')

        # extract remote uuid and associated git tree id from `git show git-annex:export.log`
        # this command only logs the latest export. previously exported tags will not show
        export_log = git_show(dataset_path, 'git-annex', 'export.log')
        log_remote_id_pattern = re.compile(':(.+) .+$')
        match = log_remote_id_pattern.search(export_log)
        remote_id_B = match.group(1)
        log_tree_id_pattern = re.compile('.* (.+)$')
        match = log_tree_id_pattern.search(export_log)
        tree_id_A = match.group(1)

        # extract git tree id of <tag> from git reference
        repo = pygit2.Repository(dataset_path)
        tag_reference = repo.references[f'refs/tags/{tag}']
        tree_id_B = tag_reference.tree_id
    except AttributeError:
        return False
    # if the remote uuids and tree ids exist and match, then
    # <tag> is the latest export to <remote>
    return remote_id_A == remote_id_B and tree_id_A == tree_id_B


def delete_s3_sibling(dataset_id, siblings, realm):
    sibling = get_sibling_by_name(realm.s3_remote, siblings)
    if sibling:
        try:
            client = boto3.client(
                's3',
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            )
            paginator = client.get_paginator('list_object_versions')
            object_delete_list = []
            for response in paginator.paginate(Bucket=realm.s3_bucket, Prefix=f'{dataset_id}/'):
                versions = response.get('Versions', [])
                versions.extend(response.get('DeleteMarkers', []))
                object_delete_list.extend(
                    [{'VersionId': version['VersionId'], 'Key': version['Key']} for version in versions])
            for i in range(0, len(object_delete_list), 1000):
                client.delete_objects(
                    Bucket=realm.s3_bucket,
                    Delete={
                        'Objects': object_delete_list[i:i+1000],
                        'Quiet': True
                    }
                )
        except Exception as e:
            raise Exception(
                f'Attempt to delete dataset {dataset_id} from {realm.s3_remote} has failed. ({e})')


def delete_github_sibling(dataset_id):
    ses = Github(DATALAD_GITHUB_LOGIN, DATALAD_GITHUB_PASS)
    org = ses.get_organization(DATALAD_GITHUB_ORG)
    repos = org.get_repos()
    try:
        r = next(r for r in repos if r.name == dataset_id)
        r.delete()
    except StopIteration as e:
        raise Exception(
            f'Attempt to delete dataset {dataset_id} from GitHub has failed, because the dataset does not exist. ({e})')


def delete_siblings(store, dataset_id):
    ds = store.get_dataset(dataset_id)

    siblings = ds.siblings()
    delete_s3_sibling(dataset_id, siblings, DatasetRealm.PRIVATE)
    delete_s3_sibling(dataset_id, siblings, DatasetRealm.PUBLIC)

    remotes = ds.repo.get_remotes()
    if DatasetRealm.PUBLIC.github_remote in remotes:
        delete_github_sibling(dataset_id)

    for remote in remotes:
        ds.siblings('remove', remote)


def file_urls_mutation(dataset_id, snapshot_tag, file_urls):
    """
    Return the OpenNeuro mutation to update the file urls of a snapshot filetree
    """
    file_update = {
        'datasetId': dataset_id,
        'tag': snapshot_tag,
        'files': file_urls
    }
    return {
        'query': 'mutation ($files: FileUrls!) { updateSnapshotFileUrls(fileUrls: $files)}',
        'variables':
        {
            'files': file_update
        }
    }


def monitor_remote_configs(store, dataset, snapshot, realm=None):
    """Check remote configs and correct invalidities."""
    dataset_path = store.get_dataset_path(dataset)
    repo = pygit2.Repository(dataset_path)
    siblings = repo.remotes
    realm = get_dataset_realm(siblings, realm)

    s3_ok = datalad_service.common.s3.validate_s3_config(dataset_path, realm)
    if not s3_ok:
        update_s3_sibling(dataset_path, realm)


def remove_file_remotes(store, urls):
    """Removes the remotes for the file with the given annex key."""
    for url in urls:
        if 's3.amazonaws.com' in url:
            remove_object_from_s3(url)
        else:
            logger.debug(f'url is not in S3')


def remove_object_from_s3(url):
    m = re.match(r'.*?(?:s3\.amazonaws\.com\/)(.*?)\/(.*?)(?:\?|$)', url)
    bucket = m[1]
    filepath = m[2]
    version_id = re.match(r'.*?[?&]versionId=([^&]+).*$',
                          url)[1] if 'versionId=' in url else None
    client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    )
    client.delete_object(
        Bucket=bucket,
        Key=filepath,
        VersionId=version_id,
    )
