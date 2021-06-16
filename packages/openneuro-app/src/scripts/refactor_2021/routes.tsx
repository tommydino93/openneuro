import React from 'react'
import { Route, Switch } from 'react-router-dom'

// TODO - Re-enable code splitting these when we can
import DraftSnapshotRoutes from './dataset/draft-snapshot-routes'
import FrontPage from './containers/front-page'
import Faq from '../faq/faq'
import Admin from '../admin/admin'
import SearchContainer from './search/search-container'
import APIKey from '../user/api.jsx'
import ErrorRoute from '../errors/errorRoute'
import PETDummy from '../pet/dummy'
import Citation from '../pages/citation-page'

const Routes = () => (
  <Switch>
    <Route name="front-page" exact path="/" component={FrontPage} />
    <Route name="faq" exact path="/faq" component={Faq} />
    <Route name="api-key" exact path="/keygen" component={APIKey} />
    <Route name="dataset" path="/datasets" component={DraftSnapshotRoutes} />
    <Route name="search" path="/search" component={SearchContainer} />
    <Route name="admin" path="/admin" component={Admin} />
    <Route name="error" path="/error" component={ErrorRoute} />
    <Route name="pet-landing" path="/pet" component={PETDummy} />
    <Route name="citation" path="/cite" component={Citation} />
  </Switch>
)

export default Routes
