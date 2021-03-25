import React from 'react'
import PropTypes from 'prop-types'

const UploadProgress = ({ progress }) => (
  <div className="upload-progress-block">
    <div active bsStyle="success" now={progress} key={2} />
  </div>
)

UploadProgress.propTypes = {
  progress: PropTypes.number,
}

export default UploadProgress
