import getAccount from '../../utils/getAccount'

interface Options {
  deviceId: string,
}

exports.command = 'device-list-sync-items [device-id]'

exports.describe = 'List all items that are syncing to a device'

exports.builder = {
  deviceId: {},
}

exports.handler = async (argv: Options) => {
  const { deviceId } = argv

  const account = await getAccount()
  const { syncItems } = await account.syncItems(deviceId)

  for (const item of syncItems) {
    const { id, metadataType, title, location } = item
    const { uri } = location

    console.log(
      JSON.stringify(
        {
          id,
          type: metadataType,
          title,
          uri,
        },
        null,
        2,
      ),
    )
  }
}
