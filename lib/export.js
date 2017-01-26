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

async function exportArtistAlbums (artistId) {
  const library = await getLibrary()
  const result = await library.artistAlbums(artistId)
  return Promise.map(result.albums, async (album) => (Object.assign(album, {
    tracks: await exportAlbumTracks(album.id),
    thumb: library.api.getUrl(album.thumb),
  })))
}

async function exportArtists (section, size) {
  const library = await getLibrary()
  const result = await library.artists(section, {size})

  return Promise.map(result.artists, async (artist) => (Object.assign(artist, {
    albums: await exportArtistAlbums(artist.id),
    thumb: library.api.getUrl(artist.thumb),
  })))
}

async function init () {
  flags.defineString('type', 'albums', 'albums, artists or tracks')
  flags.defineInteger('section', 1, 'ID of the section to export')
  flags.defineInteger('limit', 10, 'Number of items to export')
  flags.parse()

  const type = flags.get('type')
  const section = flags.get('section')
  const limit = flags.get('limit')

  let exportedData

  switch (type) {
    case 'albums':
      exportedData = await exportAlbums(section, limit)
      break
    case 'artists':
      exportedData = await exportArtists(section, limit)
      break
    default:
      throw new Error(`Unsupported type: ${type}`)
  }

  console.log(JSON.stringify(exportedData, null, 2))
}

init().catch((err) => console.error(err))
