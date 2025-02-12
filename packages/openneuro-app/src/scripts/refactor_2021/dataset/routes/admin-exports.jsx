// dependencies -------------------------------------------------------

import React from 'react'
import { gql, useMutation } from '@apollo/client'
import Helmet from 'react-helmet'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { reexporterLogsURL } from '../../../resources/kibana'
import styled from '@emotion/styled'

const ButtonsContainer = styled.div({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: '300px',
})

const NormalizedButton = styled.button({
  margin: 0,
  fontWeight: 400,
  fontSize: '12pt',
  textAlign: 'center',
  padding: '9px 12px',
  width: '100%',
})

const SuccessMessage = styled.p({
  color: 'rgb(92, 184, 92)',
})
const InProgressMessage = styled.p({
  color: 'orange',
})
const ErrorMessage = styled.p({
  color: 'red',
})

const DividerContainer = styled.div({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
})
const HBar = styled.div({
  height: '2px',
  backgroundColor: 'lightgrey',
  flexGrow: 1,
})
const DividerText = styled.p({
  padding: '19px 1rem',
  margin: 0,
  fontWeight: 400,
  fontSize: '14pt',
  textAlign: 'center',
})

const Divider = ({ text }) => (
  <DividerContainer>
    <HBar />
    <DividerText>{text}</DividerText>
    <HBar />
  </DividerContainer>
)

Divider.propTypes = {
  text: PropTypes.string,
}

const REEXPORT_REMOTES = gql`
  mutation reexportRemotes($datasetId: ID!) {
    reexportRemotes(datasetId: $datasetId)
  }
`

const AdminExports = ({ dataset }) => {
  const [reexportRemotes, { data, loading, error }] =
    useMutation(REEXPORT_REMOTES)
  const success = data && data.reexportRemotes
  return (
    <>
      <Helmet>
        <title>Admin Dashboard - OpenNeuro</title>
      </Helmet>
      <div className="dataset-form container">
        <div className="grid">
          <div className="col col-12 grid m-t-10 m-b-20">
            <h3>Admin: Remote Exports</h3>
          </div>

          <div className="col col-4">
            <ButtonsContainer>
              {loading && (
                <InProgressMessage>Your export is starting.</InProgressMessage>
              )}
              {error && <ErrorMessage>An error has occurred.</ErrorMessage>}
              {success && (
                <SuccessMessage>Your export has begun.</SuccessMessage>
              )}
              <NormalizedButton
                className="n-button on-button--primary"
                onClick={() =>
                  reexportRemotes({ variables: { datasetId: dataset.id } })
                }
              >
                Run Export
              </NormalizedButton>
              <Divider text="or" />
              <NormalizedButton
                className="on-button on-button--nobg"
                onClick={() => {
                  window.open(reexporterLogsURL, '_blank')
                }}
              >
                View Export Logs
              </NormalizedButton>
            </ButtonsContainer>
          </div>
          <div className="col col-12 m-t-20">
            <Link className="return-link m-l-0 " to={`/datasets/${dataset.id}`}>
              Return to Dataset
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

AdminExports.propTypes = {
  dataset: PropTypes.object,
}

export default AdminExports
