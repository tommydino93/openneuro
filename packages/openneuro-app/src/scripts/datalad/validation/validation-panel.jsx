import React from 'react'
import PropTypes from 'prop-types'

class ValidationPanel extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      activeKey: '2',
    }
  }

  togglePanel = () => {
    if (
      React.Children.count(this.props.children) &&
      this.state.activeKey === '1'
    ) {
      this.setState({ activeKey: '2' })
    } else if (
      React.Children.count(this.props.children) &&
      this.state.activeKey === '2'
    ) {
      this.setState({ activeKey: '1' })
    }
  }

  render() {
    return (
      <div
        accordion
        className="validation-wrap"
        activeKey={this.state.activeKey}
        onSelect={this.togglePanel}>
        <div className="status" header={this.props.heading} eventKey="1">
          {this.props.children ? this.props.children : null}
        </div>
      </div>
    )
  }
}

ValidationPanel.propTypes = {
  heading: PropTypes.object,
  children: PropTypes.node,
}

export default ValidationPanel
