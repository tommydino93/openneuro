import { execute, subscribe } from 'graphql'
import ws from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws'
import schema from '../graphql/schema.js'

export const useSubscriptionServer = server => {
  const wsServer = new ws.Server({ server, path: '/graphql-subscriptions' })
  useServer({ schema, execute, subscribe }, wsServer)
}
