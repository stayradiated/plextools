import { Library, normalize } from 'perplexed'

import getLibrary from '../../utils/getLibrary'

interface Options {
  playlistId: number,
}

exports.command = 'albums <playlist-id>'
exports.describe = 'List all album ids in a playlist'
exports.builder = {
  playlistId: {},
}

async function * getPlaylistTracks (library: Library, id: number) {
  const initialResult = await normalize(
    library.playlistTracks(id, { size: 50 }),
  )
  let entities = initialResult.entities

  let count = 0
  const { totalSize } = entities.playlists[id]

  while (true) {
    for (const item of entities.playlists[id].items) {
      yield entities.tracks[item.track]
      count += 1
    }

    if (count >= totalSize) {
      break
    }

    const result = await normalize(
      library.playlistTracks(id, { start: count, size: 50 }),
    )
    entities = result.entities
  }
}

exports.handler = async (argv: Options) => {
  const { playlistId } = argv

  const library = await getLibrary()
  const albumIds = new Set()

  for await (const track of getPlaylistTracks(library, playlistId)) {
    albumIds.add(track.parentRatingKey)
  }

  console.log(JSON.stringify([...albumIds]))
}
