import React, { FC, useContext } from 'react'
import useState from 'react-usestateref'
import { SearchParamsCtx, removeFilterItem } from '../../search-params-ctx'
import { FacetSearch, Icon } from '@openneuro/components'

const ScannerManufacturersModelNamesInput: FC = () => {
  const { searchParams, setSearchParams } = useContext(SearchParamsCtx)
  const scannerManufacturersModelNames =
    searchParams.scannerManufacturersModelNames

  const [newInput, setNewInput, newInputRef] = useState('')

  const addScannerManufacturersModelName = () => {
    setSearchParams(prevState => ({
      ...prevState,
      scannerManufacturersModelNames: [
        ...scannerManufacturersModelNames,
        newInputRef.current,
      ],
    }))
    setNewInput('')
  }

  return (
    <FacetSearch
      accordionStyle="plain"
      label="Scanner Model"
      startOpen={false}
      className="search-authors"
      type="text"
      placeholder="Enter Scanner Model(s) to Search"
      labelStyle="default"
      name="scannerManufacturersModelNames"
      termValue={newInput}
      setTermValue={setNewInput}
      primary={true}
      color="#fff"
      icon="fas fa-plus"
      iconSize="20px"
      size="small"
      pushTerm={addScannerManufacturersModelName}
      allTerms={scannerManufacturersModelNames}
      removeFilterItem={removeFilterItem(setSearchParams)}
      helpText={
        <span>
          Each time the <Icon icon="fas fa-plus" label="plus" iconOnly={true} />{' '}
          button is clicked, it will add a search filter. Multiple words in a
          filter will return results containing any or all words. For advanced
          filters use the{' '}
          <a href="https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-simple-query-string-query.html#simple-query-string-syntax">
            simple query string syntax
          </a>
          .
        </span>
      }
    />
  )
}

export default ScannerManufacturersModelNamesInput
