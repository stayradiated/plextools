import { promises as fs } from 'fs'
import fetch from 'node-fetch'
import { Library, SORT_TRACKS_BY_ALBUM_ARTIST } from 'perplexed'
import filenamify from 'filenamify'

import getLibrary from '../utils/getLibrary'

exports.command = 'lyrics'
exports.describe = 'Export all available lyrics'
exports.builder = {}

const getTracks = (library: Library, size: number, start: number) => {
  return library.tracks(1, {
    start,
    size,
    sort: SORT_TRACKS_BY_ALBUM_ARTIST.toString(),
  })
}

async function * getAllTracks (library: Library) {
  const size = 50

  let start = 0
  let totalSize: number

  while (totalSize == null || start + size < totalSize) {
    const result = await getTracks(library, size, start)
    totalSize = result.totalSize

    console.log(`${start} / ${totalSize}`)

    for (const item of result.tracks) {
      yield item
    }

    start += size
  }
}

exports.handler = async () => {
  const library = await getLibrary()

  for await (const track of getAllTracks(library)) {
    const result = await library.track(track.id)

    const trackInfo = result.tracks[0]
    const url = await library.trackLyrics(trackInfo)

    if (url != null) {
      const res = await fetch(url)
      const text = await res.text()
      const filename = filenamify(
        `${track.grandparentTitle} -- ${track.title}.txt`,
      )
      fs.writeFile(`./lyrics/${filename}`, text)
    }
  }
}
