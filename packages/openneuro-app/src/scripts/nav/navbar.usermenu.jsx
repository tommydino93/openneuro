// dependencies ------------------------------------------------------------------

import React from 'react'
import PropTypes from 'prop-types'
import styled from '@emotion/styled'
import { withRouter, Link } from 'react-router-dom'
import Avatar from '../user/avatar.jsx'
import { DropdownButton } from 'react-bootstrap'
import withProfile from '../authentication/withProfile.js'
import signOut from '../authentication/signOut.js'

const MenuList = styled.div`
  margin-top: 10px;
  border-radius: 5px;

  @media (min-width: 768px) {
    margin-top: 0;
  }

  .dropdown-menu {
    border-radius: 5px;
    margin-top: 10px;
  }

  li {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 44px;
  }

  li + li {
    border-top: 1px solid rgb(235, 235, 235);
  }
`

const signOutAndRedirect = history => {
  signOut()
  history.push('/')
}

// component setup ---------------------------------------------------------------

const Usermenu = ({ profile, history }) => {
  let username = profile.name

  let gear = <i className="fa fa-gear" />

  return (
    <MenuList className="user-menu-group">
      <Avatar profile={profile} />
      <DropdownButton id="user-menu" title={gear}>
        <li role="presentation" className="dropdown-header">
          {username}
        </li>
        <li>
          <Link to="/keygen">Obtain an API Key</Link>
        </li>
        <li>
          <a
            onClick={() => signOutAndRedirect(history)}
            className="btn-submit-other">
            Sign Out
          </a>
        </li>
      </DropdownButton>
    </MenuList>
  )
}

Usermenu.propTypes = {
  profile: PropTypes.object,
  history: PropTypes.object,
}

export default withRouter(withProfile(Usermenu))
