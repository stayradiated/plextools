const getAccount = require('./getAccount')
const throat = require('throat')

const throttle = throat(10)

async function removeDevices () {
  const account = await getAccount()
  const devices = await account.devices()
  const nodeDevices = devices.filter((device) => device.name === 'Node.js App')
  await Promise.all(nodeDevices.map((device) =>
    throttle(() => account.removeDevice(device.id))))
  console.log(`Removed ${nodeDevices.length} devices`)
}

removeDevices()
