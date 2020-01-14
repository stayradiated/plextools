import getAccount from '../utils/getAccount'

exports.command = 'device list'

exports.describe = 'List all devices connected to an account'

exports.builder = {}

exports.handler = async () => {
  const account = await getAccount()
  const devices = await account.devices()

  for (const device of devices) {
    const { id, name } = device
    console.log(`${id}: ${name}`)
  }
}
