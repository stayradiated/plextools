const {Library} = require('perplexed')

const getServerConnection = require('./getServerConnection')

let library = null

async function getLibrary () {
  if (library == null) {
    const serverConnection = await getServerConnection()
    library = new Library(serverConnection)
  }

  return library
}

module.exports = getLibrary
