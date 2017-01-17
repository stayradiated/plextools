const client = require('./client')

client.then((library) => {
  return library.normalizedSearchAll('pa pa power', 30)
}).then((result) => {
  console.log(JSON.stringify(result, null, 2))
}).catch((err) => {
  console.error(err)
})
