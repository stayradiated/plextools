const getAccount = require('../utils/getAccount')

exports.command = 'device-remove-sync-item [device-id] [item-id]'

exports.describe = 'Remove a sync item from the device'

exports.builder = {
  deviceId: {
  },
  itemId: {
  }
}

exports.handler = async (argv) => {
  const { deviceId, itemId } = argv

  const account = await getAccount()

  await account.removeSyncItem(deviceId, itemId)
}
