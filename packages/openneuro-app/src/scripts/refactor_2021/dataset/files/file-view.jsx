import React, { useState, useEffect } from 'react'
import { Loading } from '@openneuro/components/loading'
import { apiPath } from './file.jsx'
import FileViewerType from './file-viewer-type.jsx'

const FileView = ({ datasetId, snapshotTag, path }) => {
  const url = apiPath(datasetId, snapshotTag, path)
  const [data, setData] = useState(new ArrayBuffer(0))
  const [loading, setLoading] = useState(true)

  const fetchUrl = async () => {
    const response = await fetch(url)
    const data = await response.arrayBuffer()
    setData(data)
    setLoading(false)
  }

  useEffect(() => {
    if (loading) {
      fetchUrl()
    }
  })

  if (loading) {
    return <Loading />
  } else {
    return <FileViewerType path={path} url={url} data={data} />
  }
}

export default FileView
