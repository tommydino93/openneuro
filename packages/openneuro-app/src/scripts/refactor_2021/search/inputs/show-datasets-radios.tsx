import React, { FC, useContext } from 'react'
import { SearchParamsCtx } from '../search-params-ctx'
import { FacetRadio, FacetSelect } from '@openneuro/components'
import { useCookies } from 'react-cookie'
import { getUnexpiredProfile } from '../../authentication/profile'

const ShowDatasetsRadios: FC = () => {
  const [cookies] = useCookies()
  const loggedOut = !getUnexpiredProfile(cookies)

  const { searchParams, setSearchParams } = useContext(SearchParamsCtx)

  const {
    datasetType_available,
    datasetType_selected,
    datasetStatus_available,
    datasetStatus_selected,
  } = searchParams
  const setShowSelected = datasetType_selected =>
    setSearchParams(prevState => ({
      ...prevState,
      datasetType_selected,
    }))
  const setShowMyUploadsSelected = datasetStatus_selected =>
    setSearchParams(prevState => ({
      ...prevState,
      datasetStatus_selected,
    }))

  return loggedOut ? null : (
    <>
      <FacetRadio
        radioArr={datasetType_available}
        layout="row"
        name="show-datasets"
        startOpen={true}
        label="Show"
        accordionStyle="plain"
        selected={datasetType_selected}
        setSelected={setShowSelected}
      />
      {datasetType_selected == 'My Uploads' ? (
        <FacetSelect
          selected={datasetStatus_selected}
          setSelected={setShowMyUploadsSelected}
          items={datasetStatus_available}
          accordionStyle="plain"
          label="My Datasets Status"
          startOpen={true}
        />
      ) : null}
    </>
  )
}

export default ShowDatasetsRadios