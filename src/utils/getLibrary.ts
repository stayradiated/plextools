import { Library } from 'perplexed'
import mem from 'mem'

import getServerConnection from './getServerConnection'

const getLibrary = mem(
  async (): Promise<Library> => {
    const serverConnection = await getServerConnection()
    return new Library(serverConnection)
  },
)

export default getLibrary
