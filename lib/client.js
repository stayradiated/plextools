const PlexClient = require('perplexed').default

let config
try {
  config = require('../config.json')
} catch (err) {
  console.error('Could not load config.json')
  return
}

module.exports = new PlexClient(config)
