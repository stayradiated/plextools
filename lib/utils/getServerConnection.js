const {ServerConnection} = require('perplexed')
const Promise = require('bluebird')
const { timeout } = require('promise-timeout')

const getAccount = require('./getAccount')

const SERVER = 'server'
const TIMEOUT = 5 * 1000

async function connect (account, server, connection) {
  const serverConnection = new ServerConnection(connection.uri, account)
  const startTime = Date.now()

  try {
    await timeout(
      serverConnection.fetch('/', {
        timeout: TIMEOUT
      }),
      TIMEOUT
    )
  } catch (error) {
    return {
      connection,
      ping: Infinity,
      available: false,
      server: server.id
    }
  }

  const ping = Date.now() - startTime

  return {
    connection,
    available: true,
    ping,
    server: server.id,
    serverConnection
  }
}

async function connectMultiple (account, server, connections) {
  if (connections.length <= 0) {
    throw new Error('Must pass at least one connection')
  }

  const results = await Promise.all(
    connections.map(async (c, i) => {
      const result = await connect(
        account,
        server,
        c
      )
      return result
    })
  )

  // sort by ping in ascending order
  results.sort((a, b) => a.ping - b.ping)

  const local = results.find((result) => result.connection.local)
  if (local != null && local.available) {
    return local
  }

  const available = results.find((result) => result.available)
  if (available != null) {
    return available
  }

  return results[0]
}

async function getServerConnection () {
  const account = await getAccount()
  const res = await account.resources()

  const server = res.devices.find((resource) => {
    return resource.provides.includes(SERVER)
  })

  if (server == null) {
    console.error('Could not find a server to connect to!')
    return
  }

  const status = await connectMultiple(account, server, server.connections)

  const { available, serverConnection } = status

  if (available !== true) {
    throw new Error(`Server ${server.name} is not available`)
  }

  console.warn(`# Server ${server.name} is available at ${serverConnection.uri}`)

  return serverConnection
}

module.exports = getServerConnection
