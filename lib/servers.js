const {ServerConnection} = require('perplexed')
const Promise = require('bluebird')

const getAccount = require('./getAccount')

const SERVER = 'server'
const TIMEOUT = 30 * 1000

async function connect (server, account, connection) {
  const serverConnection = new ServerConnection(connection.uri, account)
  try {
    await serverConnection.fetchJSON('/', {timeout: TIMEOUT})
  } catch (e) {
    return {server, available: false}
  }
  return {server, connection, serverConnection, available: true}
}

async function listServers () {
  const account = await getAccount()
  const res = await account.resources()
  const servers = res.devices.filter((resource) =>
    resource.provides.includes(SERVER))

  const connections = await Promise.all(servers.map((server) =>
    Promise.any(server.connections.map(connect.bind(null, server, account)))))

  connections.forEach(({server, connection, available}) => {
    let message = ''
    message += `"${server.name}"`
    message += available
      ? ' is available'
      : ' is not available'
    message += connection && connection.local
      ? ' locally'
      : ''
    message += connection
      ? ` at ${connection.protocol}://${connection.address}:${connection.port}`
      : ''
    console.log(message)
  })
}

listServers()
