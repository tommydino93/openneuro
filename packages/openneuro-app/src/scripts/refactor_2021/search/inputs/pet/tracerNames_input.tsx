import React, { FC, useContext } from 'react'
import useState from 'react-usestateref'
import { SearchParamsCtx, removeFilterItem } from '../../search-params-ctx'
import { FacetSearch, Icon } from '@openneuro/components'

const TracerNamesInput: FC = () => {
  const { searchParams, setSearchParams } = useContext(SearchParamsCtx)
  const tracerNames = searchParams.tracerNames

  const [newInput, setNewInput, newInputRef] = useState('')

  const addtracerName = () => {
    setSearchParams(prevState => ({
      ...prevState,
      tracerNames: [...tracerNames, newInputRef.current],
    }))
    setNewInput('')
  }

  return (
    <FacetSearch
      accordionStyle="plain"
      label="Radiotracers"
      startOpen={false}
      className="search-authors"
      type="text"
      placeholder="Enter Tracer(s) to Search"
      labelStyle="default"
      name="tracerNames"
      termValue={newInput}
      setTermValue={setNewInput}
      primary={true}
      color="#fff"
      icon="fas fa-plus"
      iconSize="20px"
      size="small"
      pushTerm={addtracerName}
      allTerms={tracerNames}
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

export default TracerNamesInput
