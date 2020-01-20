import { Library, Tag, MediaType } from 'perplexed'
import throat from 'throat'
import chalk from 'chalk'

import getLibrary from '../utils/getLibrary'
import getAllSectionItems from '../iterators/get-all-section-items'

type SupportedMediaType = MediaType.ARTIST | MediaType.ALBUM

interface LibraryItem {
  id: number,
  genre: Tag[],
}

exports.command = 'fix-genre-tags'

exports.describe = 'Split combined genre tags into seperate genres'

exports.builder = {
  'section-id': {
    type: 'number',
    default: 1,
  },
}

const REPLACE = new Map([
  [/^Hip Hop$/, 'Hip-Hop'],
  [/^Trip Hop$/, 'Trip-Hop'],
  [/^Synth Pop$/, 'Synthpop'],
  [/^Blues-Rock$/, 'Blues Rock'],
  [/^Chill Out$/, 'Chillout'],
  [/^Neo\s+/, 'Neo-'],
])

const fmtId = (id: number) => {
  return chalk.yellow(`[${id}]`)
}

const MAX_CONCURRENCY = 10

const throttle = throat(MAX_CONCURRENCY) // limit concurrent items

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
  library: Library,
  sectionId: number,
  mediaType: SupportedMediaType,
  item: LibraryItem,
  addTags: string[],
  removeTags: string[],
) {
  if (removeTags.length === 0) {
    console.log(`${fmtId(item.id)} ${chalk.magenta('no change required')}`)
    return
  }

  console.log(`${fmtId(item.id)} ${chalk.green('saving tags...')}`)
  await library.modifyGenre(sectionId, mediaType, item.id, addTags, removeTags)
  console.log(`${fmtId(item.id)} ${chalk.greenBright('...saved!')}`)
}

async function cleanItem (
  library: Library,
  sectionId: number,
  mediaType: SupportedMediaType,
  id: number,
) {
  console.log(`${fmtId(id)} ${chalk.magenta('fetching...')}`)
  const item = await library.typedMetadata(id, mediaType)

  console.log(`${fmtId(id)} ${chalk.cyan(item.title)}`)
  const { addTags, removeTags } = cleanTags(item)
  return saveTags(library, sectionId, mediaType, item, addTags, removeTags)
}

async function cleanAllItemsOfType (
  library: Library,
  sectionId: number,
  mediaType: SupportedMediaType,
) {
  console.log(
    chalk.magenta(`Fetching all items of type: ${MediaType[mediaType]}`),
  )
  for await (const item of getAllSectionItems({
    library,
    sectionId,
    mediaType,
  })) {
    throttle(() => cleanItem(library, sectionId, mediaType, item.id))
  }
}

interface Options {
  sectionId: number,
}

exports.handler = async (argv: Options) => {
  const { sectionId } = argv
  const library = await getLibrary()
  await cleanAllItemsOfType(library, sectionId, MediaType.ARTIST)
  await cleanAllItemsOfType(library, sectionId, MediaType.ALBUM)
}
