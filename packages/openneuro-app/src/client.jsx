/**
 * Browser client entrypoint - see server.tsx for SSR entrypoint
 */
import './scripts/utils/global-polyfill'
import './scripts/apm.js'
import { ApolloProvider, InMemoryCache } from '@apollo/client'
import { createClient } from '@openneuro/client'
import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Route } from 'react-router-dom'
import App from './scripts/app'
import Index from './scripts/index'
import analyticsWrapper from './scripts/utils/analytics'
import { version } from './lerna.json'
import { config } from './scripts/config'
import * as gtag from './scripts/utils/gtag'
import { relayStylePagination } from '@apollo/client/utilities'

gtag.initialize(config.analytics.trackingIds)

ReactDOM.hydrate(
  <App>
    <ApolloProvider
      client={createClient(`${config.url}/crn/graphql`, {
        clientVersion: version,
        enableWebsocket: true,
        cache: new InMemoryCache({
          typePolicies: {
            Query: {
              fields: {
                advancedSearch: relayStylePagination(),
              },
            },
          },
          // @ts-expect-error
        }).restore(JSON.parse(window.__APOLLO_STATE__)),
      })}
    >
      <BrowserRouter>
        <Route component={analyticsWrapper(Index)} />
      </BrowserRouter>
    </ApolloProvider>
  </App>,
  document.getElementById('main'),
)
