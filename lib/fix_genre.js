const {ALBUM, ARTIST} = require('perplexed')
const throat = require('throat')
const hasFlag = require('has-flag')

const client = require('./client')

const throttle = throat(10) // limit concurrent items

const cleanTags = (item) => {
  const original = new Set(item.genre)
  const cleaned = new Set(
    item.genre
      .map((g) => g.split(', '))
      .reduce((a, x) => a.concat(x), [])
  )
  const removed = new Set(
    [...original].filter((x) => !cleaned.has(x))
  )
  return {
    addTags: [...cleaned],
    removeTags: [...removed],
  }
}

const saveTags = (sectionId, type, item, addTags, removeTags) => {
  if (removeTags.length === 0) {
    console.log(`${item.id}: no change required`)
    return
  }

  console.log(`${item.id}: saving tags...`)
  return client.modifyGenre(sectionId, type, item.id, addTags, removeTags)
    .then(() => console.log(`${item.id}: ...saved!`))
    .catch((err) => console.error(err))
}

const cleanItem = (sectionId, type, id) => {
  console.log(`${id}: fetching...`)
  return client.metadata(id, type).then((container) => {
    const item = container.items[0]
    console.log(`${id}: ${item.title}`)

    const {addTags, removeTags} = cleanTags(item)
    return saveTags(sectionId, type, item, addTags, removeTags)
  })
}

const cleanAllItemsOfType = (sectionId, type) => {
  console.log(`Fetching all items of type: ${type}`)
  client.allOfType(sectionId, type).then((container) =>
    Promise.all(container.items.map((item) =>
      throttle(() => cleanItem(sectionId, type, item.id)))))
}


Promise.resolve()
  .then(() => {
    if (hasFlag('artist') || hasFlag('artists')) {
      return cleanAllItemsOfType(1, ARTIST)
    }
  })
  .then(() => {
    if (hasFlag('album') || hasFlag('albums')) {
      return cleanAllItemsOfType(1, ALBUM)
    }
  })

