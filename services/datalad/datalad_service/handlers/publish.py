import asyncio
import falcon

from datalad_service.tasks.publish import publish_dataset


class PublishResource(object):

    """A Falcon API wrapper around underlying datalad/git-annex datasets."""

    def __init__(self, store):
        self.store = store

    async def on_post(self, req, resp, dataset):
        dataset_path = self.store.get_dataset_path(dataset)

        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, publish_dataset, dataset_path, cookies=req.cookies)

        resp.media = {}
        resp.status = falcon.HTTP_OK
