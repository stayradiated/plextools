const {ServerConnection, Library} = require('perplexed')

const config = require('../config.json')
const getAccount = require('./getAccount')

let library = null

async function getLibrary () {
  if (library == null) {
    const account = await getAccount()
    const sc = new ServerConnection(
      `http://${config.hostname}:${config.port}`, account)
    library = new Library(sc)
  }

  return library
}

module.exports = getLibrary
