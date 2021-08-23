import asyncio
import logging

import falcon

from datalad_service.tasks.snapshots import SnapshotDescriptionException, create_snapshot, get_snapshot, get_snapshots, SnapshotExistsException
from datalad_service.tasks.files import get_files
from datalad_service.tasks.publish import publish_snapshot, monitor_remote_configs
from datalad_service.common.git import delete_tag


class SnapshotResource(object):

    """Snapshots on top of DataLad datasets."""

    def __init__(self, store):
        self.store = store
        self.logger = logging.getLogger('datalad_service.' + __name__)

    async def on_get(self, req, resp, dataset, snapshot=None):
        """Get the tree of files for a snapshot."""
        if snapshot:
            files = get_files(self.store, dataset,
                              branch=snapshot)
            response = get_snapshot(self.store, dataset, snapshot)
            response['files'] = files
            resp.media = response
            resp.status = falcon.HTTP_OK
        else:
            tags = get_snapshots(self.store,
                                 dataset)
            resp.media = {'snapshots': tags}
            resp.status = falcon.HTTP_OK

    async def on_post(self, req, resp, dataset, snapshot):
        """Commit a revision (snapshot) from the working tree."""
        media = req.media
        description_fields = {}
        snapshot_changes = []
        skip_publishing = False
        if media != None:
            description_fields = media.get('description_fields')
            snapshot_changes = media.get('snapshot_changes')
            skip_publishing = media.get('skip_publishing')

        monitor_remote_configs(
            self.store, dataset, snapshot)

        try:
            created = create_snapshot(
                self.store, dataset, snapshot, description_fields, snapshot_changes)

            resp.media = created
            resp.status = falcon.HTTP_OK

            if not skip_publishing:
                loop = asyncio.get_running_loop()
                # Publish after response
                await loop.run_in_executor(None, publish_snapshot, self.store,
                                           dataset, req.cookies, snapshot)

        except SnapshotExistsException as err:
            resp.media = {'error': repr(err)}
            resp.status = falcon.HTTP_CONFLICT
        except SnapshotDescriptionException as err:
            resp.media = {'error': repr(err)}
            resp.status = falcon.HTTP_BAD_REQUEST

    async def on_delete(self, req, resp, dataset, snapshot):
        """Remove a tag on the dataset, which is equivalent to deleting a snapshot"""
        if snapshot:
            dataset_path = self.store.get_dataset_path(dataset)
            delete_tag(dataset_path, snapshot)
            resp.media = {}
            resp.status = falcon.HTTP_OK
        else:
            resp.media = {'error': 'no snapshot tag specified'}
