import getServerConnection from '../utils/getServerConnection'

async function listServers () {
  await getServerConnection()
}

exports.command = 'server list'
exports.describe = 'List all available servers'
exports.builder = {}
exports.handler = listServers
