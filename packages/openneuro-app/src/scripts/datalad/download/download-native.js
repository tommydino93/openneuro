import * as Sentry from '@sentry/browser'
import { trackDownload } from './track-download.js'
import {
  nativeErrorToast,
  permissionsToast,
  downloadCompleteToast,
} from './native-file-toast.jsx'
import { downloadUri } from './download-uri.js'

/**
 * Given a file, create any missing parent directories, obtain directory handle, and return the file handle within that
 * @param {*} initialDirectoryHandle Native file API directoryEntry
 * @param {string} path 'sub-01/anat/subject-image.nii.gz' style paths
 */
export const openFileTree = async (initialDirectoryHandle, path) => {
  let directoryHandle = initialDirectoryHandle
  // Get list of any parent directories
  const pathTokens = path.split('/')
  const dirTokens = pathTokens.slice(0, -1)
  const filename = pathTokens.slice(-1)
  if (dirTokens.length > 0) {
    for (const token of dirTokens) {
      directoryHandle = await directoryHandle.getDirectory(token, {
        create: true,
      })
    }
  }
  return directoryHandle.getFile(filename, { create: true })
}

/**
 * Request permission to download multiple files
 * bit of a hack until the Permissions API supports this
 */
export const requestDownloadPermission = () => {
  const anchor = document.createElement('a')
  anchor.download = 'download-permission'
  anchor.href =
    'data:,this file was created to request download permissions and can be deleted'
  // Must click twice
  anchor.click()
  anchor.click()
}

/**
 * Downloads a dataset via the native file API, skipping expensive compression if the browser supports it
 * @param {string} datasetId Accession number string for a dataset
 * @param {string} snapshotTag Snapshot tag name
 */
export const downloadNative = (datasetId, snapshotTag) => async () => {
  const uri = downloadUri(datasetId, snapshotTag)
  const filesToDownload = await (await fetch(uri + '?skip-bundle')).json()
  // Try trackDownload but don't worry if it fails
  const downloadTotal = filesToDownload.files.reduce(
    (total, file) => total + file.size,
    0,
  )
  const downloadName = `${datasetId}${snapshotTag ? '-' + snapshotTag : ''}`
  const urls = filesToDownload.files.map(file => file.urls[0])
  console.log(downloadTotal, urls)
  const registration = await navigator.serviceWorker.ready
  // TODO - get the first successful file
  const bgFetch = await registration.backgroundFetch.fetch(downloadName, urls, {
    title: downloadName,
    downloadTotal,
  })
  bgFetch.addEventListener('progress', () => {
    console.log(
      `Downloaded ${(bgFetch.downloaded / bgFetch.downloadTotal) * 100}%`,
    )
  })
  console.log('pre-request')
  const request = await bgFetch.match(urls[0])
  console.dir(request)
  const response = await request.responseReady
  console.dir(response)
  /*
    for (const file of filesToDownload.files) {
      const fileHandle = await openFileTree(dirHandle, file.filename)
      // Skip files which are already complete
      if (fileHandle.size == file.size) continue
      const writer = await fileHandle.createWriter()
      //const ff = await fetch(file.urls.pop())
      //await writer.write(0, await ff.arrayBuffer())
      //await writer.close()
    }*/
  //downloadCompleteToast(dirHandle.name)
}
