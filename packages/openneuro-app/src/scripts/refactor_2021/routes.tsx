import React from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'

// TODO - Re-enable code splitting these when we can
import Dataset from './dataset/draft-snapshot-routes'
//import PreRefactorDatasetProps from './dataset/dataset-pre-refactor-container'

import { FAQS } from '@openneuro/components/faqs'
import FrontPageContainer from './containers/front-page-container'
import Admin from './admin/admin'
import SearchRoutes from './search/search-routes'
import APIKey from './user/api'
import ErrorRoute from '../errors/errorRoute'
import { PETRedirect } from '../pet/redirect'
import Citation from '../pages/citation-page'
import FourOFourPage from '../errors/404page'

const Routes: React.VoidFunctionComponent = () => (
  <Switch>
    <Route name="faq" exact path="/faq" component={FAQS} />
    <Route name="front-page" exact path="/" component={FrontPageContainer} />
    <Route name="api-key" exact path="/keygen" component={APIKey} />
    <Route name="dataset" path="/datasets" component={Dataset} />
    <Route name="search" path="/search" component={SearchRoutes} />
    <Route name="admin" path="/admin" component={Admin} />
    <Route name="error" path="/error" component={ErrorRoute} />
    <Route name="pet-landing" path="/pet" component={PETRedirect} />
    <Route name="citation" path="/cite" component={Citation} />
    <Redirect from="/public" to="/search" />
    <Redirect from="/saved" to="/search?bookmarks" />
    <Redirect from="/dashboard" to="/search?mydatasets" />
    <Route component={FourOFourPage} />
  </Switch>
)

export default Routes
