import React from 'react'

import { SearchResultItem } from './SearchResultItem'

import './search-page.scss'

export interface SearchResultsListProps {
  items
  profile?: Record<string, any>
  datasetTypeSelected: string
  hasEditPermissions: (permissions: any, userId: any) => boolean
}
export const SearchResultsList = ({
  items,
  profile,
  datasetTypeSelected,
  hasEditPermissions,
}: SearchResultsListProps) => {
  return (
    <div className="search-results">
      {items.map(data => {
        if (data)
          return (
            <SearchResultItem
              node={data.node}
              key={data.node.id}
              profile={profile}
              hasEditPermissions={hasEditPermissions}
              datasetTypeSelected={datasetTypeSelected}
            />
          )
      })}
    </div>
  )
}
