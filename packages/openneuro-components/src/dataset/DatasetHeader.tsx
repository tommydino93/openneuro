import React from 'react'
import { Link } from 'react-router-dom'

export interface DatasetHeaderProps {
  modality: string
  pageHeading: string
  renderEditor?: () => React.ReactNode
}

export const DatasetHeader: React.FC<DatasetHeaderProps> = ({
  pageHeading,
  modality,
  renderEditor,
}) => {
  return (
    <div className="dataset-header">
      <div className="container">
        <div className="grid grid-between">
          <div className="col">
            <h1>
              <Link to={'/search/modality/' + modality}>
                <div className="hexagon-wrapper">
                  <div className="hexagon no-modality"></div>
                  <div className="label">
                    {modality === null ? (
                      <i className="fa fa-circle-o-notch fa-spin"></i>
                    ) : (
                      modality.substr(0, 4)
                    )}
                  </div>
                </div>
              </Link>
              {renderEditor?.() || pageHeading}
            </h1>
          </div>
        </div>
      </div>
    </div>
  )
}
