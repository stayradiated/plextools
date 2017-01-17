const {ServerConnection, Library} = require('perplexed')

const config = require('../config.json')
const getAccount = require('./getAccount')

async function getLibrary () {
  const account = await getAccount()
  const sc = new ServerConnection(
    `http://${config.hostname}:${config.port}`, account)
  const lib = new Library(sc)
  return lib
}

module.exports = getLibrary
