const fs = require('fs').promises
const fetch = require('node-fetch')
const { normalize, SORT_TRACKS_BY_ALBUM_ARTIST } = require('perplexed')
const filenamify = require('filenamify')

const getLibrary = require('./getLibrary')

const paginate = (fn, size, start = 0) => async (...args) => {
  const result = await fn(...args, size, start)
  const { totalSize } = result
  console.log(`${start} / ${totalSize}`)
  return {
    result,
    more: start + size < totalSize,
    next: () => paginate(fn, size, start + size)(...args)
  }
}

const getTracks = (library, size, start) => {
  return library.tracks(1, {
    start,
    size,
    sort: SORT_TRACKS_BY_ALBUM_ARTIST
  })
}

const getAllTracks = paginate(getTracks, 50)

async function playlistLyrics (playQueueId) {
  const library = await getLibrary()

  let { result, more, next } = await getAllTracks(library)

  while (more) {
    const tracks = result.tracks
    const lyrics = await Promise.all(
      tracks.map(async (t) => {
        const result = await library.track(t.id)
        const track = result.tracks[0]
        const url = await library.trackLyrics(track)


        if (url != null) {
          const res = await fetch(url)
          const text = await res.text()
          const filename = filenamify(`${track.grandparentTitle} -- ${track.title}.txt`)
          fs.writeFile(`./lyrics/${filename}`, text)
        }
      })
    )

    const _result = await next()
    result = _result.result
    more = _result.more
    next = _result.next
  }

}

module.exports = playlistLyrics
