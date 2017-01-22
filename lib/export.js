const Promise = require('bluebird')
const flags = require('flags')

const getLibrary = require('./getLibrary')

async function exportAlbumTracks (albumId) {
  const library = await getLibrary()
  const result = await library.albumTracks(albumId)

  return result.tracks.map((track) => ({
    id: track.id,
    index: track.index,
    title: track.title,
    artist: track.originalTitle || track.grandparentTitle,
    album: track.parentTitle,
    duration: track.duration,
    userRating: track.userRating,
  }))
}

async function exportAlbums (section, size) {
  const library = await getLibrary()
  const result = await library.albums(section, {size})

  return Promise.map(result.albums, async (album) => ({
    id: album.id,
    title: album.title,
    artist: album.parentTitle,
    year: album.year,
    thumb: library.api.getUrl(album.thumb),
    tracks: await exportAlbumTracks(album.id),
    addedAt: album.addedAt,
    userRating: album.userRating,
  }))
}

(async function init () {
  flags.defineInteger('section', 1, 'ID of the section to export')
  flags.defineInteger('limit', 10, 'Number of albums to export')
  flags.parse()

  const exportedData = await exportAlbums(
    flags.get('section'), flags.get('limit'))
  console.log(JSON.stringify(exportedData, null, 2))
}())
