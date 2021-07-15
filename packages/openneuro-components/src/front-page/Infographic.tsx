import React from 'react'

import { frontPage } from '../mock-content/front-page-content.jsx'

export interface InfographicProps {}

export const Infographic: React.FC<InfographicProps> = ({}) => {
  return (
    <div className="front-infographic">
      <span className="bg-circle"></span>
      {frontPage.infographic.map((item, index) => (
        <div key={index} className="infograph-block" id={item.htmlID}>
          <span>
            <img src={item.image} alt="" />
          </span>
          <div className="info-card">
            <h3>{item.name}</h3>
            <div>{item.content}</div>
          </div>
        </div>
      ))}
      <div className="view-docs">
        <h3>Want to get started?</h3>
        Check out the{' '}
        <a href="https://docs.openneuro.org/user-guide" target="_blank">
          OpenNeuro User Documentation
        </a>
      </div>
    </div>
  )
}
