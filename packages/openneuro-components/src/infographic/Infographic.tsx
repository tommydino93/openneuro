import React from 'react'

import { frontPage } from '../content/front-page-content.jsx'
import './infographic.scss'
export interface InfographicProps {}

export const Infographic: React.FC<InfographicProps> = ({}) => {
  return (
    <div className="container front-infographic">
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
    </div>
  )
}
