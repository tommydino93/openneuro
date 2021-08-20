import asyncio
import json
import os
import requests

from datalad_service.config import GRAPHQL_ENDPOINT
from datalad_service.common.elasticsearch import ValidationLogger


async def setup_validator():
    """Install nodejs deps if they do not exist."""
    if not os.path.exists('./node_modules/.bin/bids-validator'):
        await asyncio.create_subprocess_exec('yarn')


async def validate_dataset_sync(dataset_path, ref, esLogger):
    """
    Synchronous dataset validation.

    Runs the bids-validator process and installs node dependencies if needed.
    """
    setup_validator()
    try:
        process = await asyncio.create_subprocess_exec('./node_modules/.bin/bids-validator', ['--json', '--ignoreSubjectConsistency', dataset_path], stdout=asyncio.subprocess.PIPE)
        return json.loads(process.stdout)
    except json.decoder.JSONDecodeError as err:
        esLogger.log(process.stdout, process.stderr, err)


def summary_mutation(dataset_id, ref, validator_output):
    """
    Return the OpenNeuro mutation to update a dataset summary.
    """
    summary = validator_output['summary']
    summary['datasetId'] = dataset_id
    # Set the object id to the git sha256 ref
    summary['id'] = ref
    return {
        'query': 'mutation ($summaryInput: SummaryInput!) { updateSummary(summary: $summaryInput) { id } }',
        'variables':
            {
                'summaryInput': summary
            }
    }


def issues_mutation(dataset_id, ref, validator_output):
    """
    Return the OpenNeuro mutation to update any validation issues.
    """
    all_issues = validator_output['issues']['warnings'] + \
        validator_output['issues']['errors']
    for issue in all_issues:
        # Remove extra stats to keep collection size down
        if 'files' in issue:
            for f in issue['files']:
                if f.get('file'):
                    if f['file'].get('stats'):
                        del f['file']['stats']
    issues = {
        'datasetId': dataset_id,
        'id': ref,
        'issues': all_issues
    }
    return {
        'query': 'mutation ($issues: ValidationInput!) { updateValidation(validation: $issues) }',
        'variables':
            {
                'issues': issues
            }
    }


async def _validate_dataset_eventlet(dataset_id, dataset_path, ref, cookies=None, user=''):
    esLogger = ValidationLogger(dataset_id, user)
    validator_output = validate_dataset_sync(dataset_path, ref, esLogger)
    if validator_output:
        if 'issues' in validator_output:
            r = requests.post(
                url=GRAPHQL_ENDPOINT, json=issues_mutation(dataset_id, ref, validator_output), cookies=cookies)
            if r.status_code != 200:
                raise Exception(r.text)
        if 'summary' in validator_output:
            r = requests.post(
                url=GRAPHQL_ENDPOINT, json=summary_mutation(dataset_id, ref, validator_output), cookies=cookies)
            if r.status_code != 200:
                raise Exception(r.text)
    else:
        raise Exception('Validation failed unexpectedly')


def validate_dataset(dataset_id, dataset_path, ref, cookies=None, user=''):
    return asyncio.create_task(_validate_dataset_eventlet,
                               dataset_id, dataset_path, ref, cookies, user)
