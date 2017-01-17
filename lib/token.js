const getAccount = require('./getAccount')

async function token () {
  const account = await getAccount()
  console.log(account)
}

token()
