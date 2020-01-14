import mem from 'mem'
import { Client, Account } from 'perplexed'

const config = require('../../config.json')

const getAccount = mem(
  async (): Promise<Account> => {
    const client = new Client(config.options)
    const account = new Account(client)

    await account.authenticate(config.username, config.password)
    return account
  },
)

export default getAccount
