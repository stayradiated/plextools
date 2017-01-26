const Promise = require('bluebird')
const flags = require('flags')

const getLibrary = require('./getLibrary')

async function exportAlbumTracks (albumId) {
  const library = await getLibrary()
  const result = await library.albumTracks(albumId)
  return result.tracks
}

async function exportAlbums (section, size) {
  const library = await getLibrary()
  const result = await library.albums(section, {size})

  return Promise.map(result.albums, async (album) => (Object.assign(album, {
    tracks: await exportAlbumTracks(album.id),
    thumb: library.api.getUrl(album.thumb),
  })))
}

(async function init () {
  flags.defineInteger('section', 1, 'ID of the section to export')
  flags.defineInteger('limit', 10, 'Number of albums to export')
  flags.parse()

  const exportedData = await exportAlbums(
    flags.get('section'), flags.get('limit'))
  console.log(JSON.stringify(exportedData, null, 2))
}())
