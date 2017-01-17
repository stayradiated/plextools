const client = require('./client')

client.api._authenticate()
  .then(() => client.user())
  .then((data) => console.log(data))
  .catch((err) => console.error(err))
