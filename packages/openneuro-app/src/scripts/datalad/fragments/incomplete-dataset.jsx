import React from 'react'
import PropTypes from 'prop-types'
import UploadResume from '../../uploader/upload-resume.jsx'

const IncompleteDataset = ({ datasetId }) => (
  <div className="fade-in col-xs-12 validation">
    <h3 className="metaheader">Incomplete Upload or Edit</h3>
    <div accordion className="validation-wrap">
      <div className="status">
        <p>An upload or edit may have been interrupted.</p>
        <UploadResume datasetId={datasetId} />
      </div>
    </div>
  </div>
)

IncompleteDataset.propTypes = {
  datasetId: PropTypes.string,
}

export default IncompleteDataset
