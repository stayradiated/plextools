import { Album, MediaType, Library } from 'perplexed'
import throat from 'throat'
import chalk from 'chalk'

import load from '../offline/load'
import getLibrary from '../utils/getLibrary'
import getAllSectionItems from '../iterators/get-all-section-items'
import printAlbum from '../print/album'

const MAX_CONCURRENCY = 5

export const command = 'duplicate-albums'

export const describe = 'List duplicate albums'

export const builder = {
  'section-id': {
    type: 'number',
    default: 1,
  },
  'offline-path': {
    type: 'string',
  },
}

interface Options {
  sectionId: number,
  offlinePath?: string,
}

export const unmatchAlbum = async (library: Library, album: Album) => {
  if (album.guid.startsWith('local://')) {
    return
  }
  try {
    await library.unmatch(album.id, { timeout: 5000 })
  } catch (error) {
    console.warn(error)
  }
}

export const refreshAlbum = async (library: Library, album: Album) => {
  try {
    await library.refreshMetadata(album.id, { timeout: 5000 })
  } catch (error) {
    console.warn(error)
  }
}

export const handler = async (argv: Options) => {
  const { sectionId, offlinePath } = argv

  const allAlbums = [] as Album[]

  if (offlinePath) {
    const allItems = await load({ path: offlinePath })
    allAlbums.push(...allItems.albums)
  } else {
    const library = await getLibrary()
    for await (const album of getAllSectionItems({
      library,
      sectionId,
      mediaType: MediaType.ALBUM,
    })) {
      allAlbums.push(album as Album)
    }
  }

  const index = new Map<string, Album[]>()

  for (const album of allAlbums) {
    const { title, parentTitle } = album

    const key = JSON.stringify([parentTitle.toLowerCase(), title.toLowerCase()])

    if (index.has(key) === false) {
      index.set(key, [])
    }

    index.get(key).push(album)
  }

  const pendingUpdates = [] as Album[][]

  for (const albums of index.values()) {
    if (albums.length > 1) {
      console.log()
      for (const album of albums) {
        printAlbum(album)
      }
      pendingUpdates.push(albums)
    }
  }

  console.log(`Fixing ${pendingUpdates.length} set(s) of duplicate albums...`)

  if (offlinePath != null) {
    console.log(chalk.redBright('Running in offline mode, skipping updates...'))
  } else {
    const library = await getLibrary()

    for (const albumGroup of pendingUpdates) {
      await Promise.all(
        albumGroup.map(
          throat(MAX_CONCURRENCY, (album) => unmatchAlbum(library, album)),
        ),
      )
      await Promise.all(
        albumGroup.map(
          throat(MAX_CONCURRENCY, (album) => refreshAlbum(library, album)),
        ),
      )
    }
  }
}
