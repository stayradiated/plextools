const {Client, Account} = require('perplexed')

const config = require('../config.json')

const client = new Client(config.options)
const account = new Account(client)

async function getAccount () {
  await account.authenticate(config.username, config.password)
  return account
}

module.exports = getAccount
