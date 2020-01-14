import { Library, Tag, MediaType } from 'perplexed'
import throat from 'throat'

import getLibrary from '../utils/getLibrary'

interface LibraryItem {
  id: number,
  genre: Tag[],
}

exports.command = 'fix-genre-tags'

exports.describe = 'Split combined genre tags into seperate genres'

exports.builder = {}

const getItems = (container: any, type: MediaType) => {
  switch (type) {
    case MediaType.ALBUM:
      return container.albums
    case MediaType.ARTIST:
      return container.artists
    default:
      throw new Error(`Unsupported media type: ${type}`)
  }
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

const cleanTags = (item: LibraryItem) => {
  const tagNames: string[] = item.genre.map((tag) => tag.tag)

  const dupes = new Set<string>()

  // for each item in the array
  // check to see it exists more than once in the array
  for (let i = 0, len = tagNames.length; i < len - 1; i += 1) {
    for (let j = i + 1; j < len; j += 1) {
      if (tagNames[i] === tagNames[j]) {
        dupes.add(tagNames[i])
      }
    }
  }

  const original = new Set<string>(tagNames)

  const cleaned = new Set<string>(
    tagNames
      .map((g) => g.split(', '))
      .reduce((a, x) => a.concat(x), [])
      .map((tag) => {
        for (const [regex, value] of REPLACE) {
          tag = tag.replace(regex, value)
        }
        return tag
      }),
  )
  const removed = new Set<string>([...original].filter((x) => !cleaned.has(x)))
  return {
    addTags: [...cleaned],
    removeTags: [...removed, ...dupes],
  }
}

async function saveTags (
  lib: Library,
  sectionId: number,
  type: MediaType,
  item: LibraryItem,
  addTags: string[],
  removeTags: string[],
) {
  if (removeTags.length === 0) {
    console.log(`${item.id}: no change required`)
    return
  }

  console.log(`${item.id}: saving tags...`)
  await lib.modifyGenre(sectionId, type, item.id, addTags, removeTags)
  console.log(`${item.id}: ...saved!`)
}

async function cleanItem (
  lib: Library,
  sectionId: number,
  type: MediaType,
  id: number,
) {
  console.log(`${id}: fetching...`)
  const container = await lib.metadata(id, type)

  const items = getItems(container, type)
  const item = items[0]

  console.log(`${id}: ${item.title}`)
  const { addTags, removeTags } = cleanTags(item)
  return saveTags(lib, sectionId, type, item, addTags, removeTags)
}

async function cleanAllItemsOfType (
  lib: Library,
  sectionId: number,
  type: MediaType,
) {
  console.log(`Fetching all items of type: ${type}`)
  const container = await lib.sectionItems(sectionId, type)
  const items = getItems(container, type)

  return Promise.all(
    items.map((item: LibraryItem) =>
      throttle(() => cleanItem(lib, sectionId, type, item.id)),
    ),
  )
}

exports.handler = async () => {
  const lib = await getLibrary()
  await cleanAllItemsOfType(lib, 1, MediaType.ARTIST)
  await cleanAllItemsOfType(lib, 1, MediaType.ALBUM)
}
