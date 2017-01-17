const getAccount = require('./getAccount')

async function listServers () {
  const account = await getAccount()
  const resources = await account.resources()
  const servers = resources.devices
    .filter((d) => d.provides.includes('server'))
  console.log(JSON.stringify(servers, null, 2))
}

listServers()
