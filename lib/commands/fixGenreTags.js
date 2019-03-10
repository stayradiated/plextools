const {ALBUM, ARTIST} = require('perplexed')
const throat = require('throat')

const getLibrary = require('../utils/getLibrary')

exports.command = 'fix-genre-tags'

exports.describe = 'Split combined genre tags into seperate genres'

exports.builder = {}

const TYPE_ITEMS = {
  [ALBUM]: 'albums',
  [ARTIST]: 'artists',
}

const REPLACE = new Map([
  [/^Hip Hop$/, 'Hip-Hop'],
  [/^Trip Hop$/, 'Trip-Hop'],
  [/^Synth Pop$/, 'Synthpop'],
  [/^Blues-Rock$/, 'Blues Rock'],
  [/^Chill Out$/, 'Chillout'],
  [/^Neo\s+/, 'Neo-'],
])

const throttle = throat(10) // limit concurrent items

const cleanTags = (item) => {
  const dupes = new Set()

  // for each item in the array
  // check to see it exists more than once in the array
  for (let i = 0, len = item.genre.length; i < len - 1; i += 1) {
    for (let j = i + 1; j < len; j += 1) {
      if (item.genre[i] === item.genre[j]) {
        dupes.add(item.genre[i])
      }
    }
  }

  const original = new Set(item.genre)
  const cleaned = new Set(
    item.genre
      .map((g) => g.split(', '))
      .reduce((a, x) => a.concat(x), [])
      .map((tag) => {
        for (const [regex, value] of REPLACE) {
          tag = tag.replace(regex, value)
        }
        return tag
      })

  )
  const removed = new Set(
    [...original].filter((x) => !cleaned.has(x))
  )
  return {
    addTags: [...cleaned],
    removeTags: [...removed, ...dupes],
  }
}

async function saveTags (lib, sectionId, type, item, addTags, removeTags) {
  if (removeTags.length === 0) {
    console.log(`${item.id}: no change required`)
    return
  }

  console.log(`${item.id}: saving tags...`)
  await lib.modifyGenre(sectionId, type, item.id, addTags, removeTags)
  console.log(`${item.id}: ...saved!`)
}

async function cleanItem (lib, sectionId, type, id) {
  console.log(`${id}: fetching...`)
  const container = await lib.metadata(id, type)
  const itemsKey = TYPE_ITEMS[type]
  const item = container[itemsKey][0]
  console.log(`${id}: ${item.title}`)
  const {addTags, removeTags} = cleanTags(item)
  return saveTags(lib, sectionId, type, item, addTags, removeTags)
}

async function cleanAllItemsOfType (lib, sectionId, type) {
  console.log(`Fetching all items of type: ${type}`)
  const container = await lib.sectionItems(sectionId, type)
  const itemsKey = TYPE_ITEMS[type]
  return Promise.all(container[itemsKey].map((item) =>
    throttle(() => cleanItem(lib, sectionId, type, item.id))))
}

exports.handler = async () => {
  const lib = await getLibrary()
  await cleanAllItemsOfType(lib, 1, ARTIST)
  await cleanAllItemsOfType(lib, 1, ALBUM)
}
