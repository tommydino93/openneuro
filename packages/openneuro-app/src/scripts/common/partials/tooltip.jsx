// dependencies ------------------------------------------------------------------

import React from 'react'
import PropTypes from 'prop-types'
import newId from '../../utils/newid'

export default class TooltipTop extends React.PureComponent {
  constructor(props) {
    super(props)
    this.id = newId('tooltip-id-')
  }

  render() {
    const tooltip = <div id={this.id}>{this.props.tooltip}</div>

    return this.props.tooltip ? (
      <div
        placement="top"
        overlay={tooltip}
        delayShow={300}
        delayHide={150}>
        {this.props.children}
      </div>
    ) : (
      this.props.children
    )
  }
}

TooltipTop.propTypes = {
  tooltip: PropTypes.string,
  children: PropTypes.object,
}
