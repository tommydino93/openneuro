// dependencies ----------------------------------------------------------------------

import Reflux from 'reflux'
import actions from './notification.actions.js'

// store setup -----------------------------------------------------------------------

let UploadStore = Reflux.createStore({
  listenables: actions,

  init: function() {
    this.setInitialState()
    this.showUpgradeWarning()
  },

  getInitialState: function() {
    return this.data
  },

  // state data ------------------------------------------------------------------------

  data: {},

  update: function(data, callback) {
    for (let prop in data) {
      this.data[prop] = data[prop]
    }
    this.trigger(this.data, callback)
  },

  showUpgradeWarning() {
    this.update({
      showAlert: true,
      alertType: 'Warning',
      alertMessage:
        'We are upgrading to a new storage backend. The website will have limited functionality until Tuesday, July 17th.',
      timeout: null,
    })
  },

  /**
   * Set Initial State
   *
   * Sets the state to the data object defined
   * inside the function. Also takes a diffs object
   * which will set the state to the initial state
   * with any differences passed.
   */
  setInitialState: function(diffs, callback) {
    let data = {
      showAlert: false,
      alertType: null,
      alertMessage: '',
      timeout: null,
    }
    for (let prop in diffs) {
      data[prop] = diffs[prop]
    }
    this.update(data, callback)
  },

  // actions ---------------------------------------------------------------------------

  /**
   * Create Alert
   */
  createAlert(alert) {
    this.update({
      showAlert: true,
      alertType: alert.type,
      alertMessage: alert.message,
      timeout: alert.timeout,
    })
    if (alert.timeout != null) {
      window.setTimeout(this.closeAlert, alert.timeout)
    }
  },

  /**
   * Close Alert
   *
   */
  closeAlert() {
    this.setInitialState()
  },
})

export default UploadStore
