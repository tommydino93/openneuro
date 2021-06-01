import React from 'react'

import { SearchResult } from './SearchResult'

import './search-page.scss'

export interface SearchResultsProps {
  items
  profile?: Record<string, any>
}
export const SearchResults = ({ items, profile }: SearchResultsProps) => {
  return (
    <div className="search-results">
      {items.map(({ node }, index) => (
        <SearchResult node={node} key={index} profile={profile} />
      ))}
    </div>
  )
}