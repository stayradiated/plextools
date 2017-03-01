const Promise = require('bluebird')
const flags = require('flags')

const getLibrary = require('./getLibrary')

async function convertTracks (tracks) {
  const library = await getLibrary()
  return tracks.map((track) => Object.assign({}, track, {
    parentThumb: library.api.getUrl(track.parentThumb),
    thumb: library.api.getUrl(track.thumb),
    mediaPath: library.api.getUrl(track.media[0].part[0].key),
  }))
}

async function exportAlbumTracks (albumId, size) {
  const library = await getLibrary()
  const result = await library.albumTracks(albumId, {size})
  return convertTracks(result.tracks)
}

async function exportAlbums (section, size, maxTracks) {
  const library = await getLibrary()
  const result = await library.albums(section, {size})

  return Promise.map(result.albums, async (album) => Object.assign({}, album, {
    tracks: await exportAlbumTracks(album.id, maxTracks),
    thumb: library.api.getUrl(album.thumb),
  }))
}

async function exportArtistAlbums (artistId, maxTracks) {
  const library = await getLibrary()
  const result = await library.artistAlbums(artistId)
  return Promise.map(result.albums, async (album) => Object.assign({}, album, {
    tracks: await exportAlbumTracks(album.id, maxTracks),
    thumb: library.api.getUrl(album.thumb),
  }))
}

async function exportArtists (section, size, maxTracks) {
  const library = await getLibrary()
  const result = await library.artists(section, {size})
  return Promise.map(result.artists, async (artist) => Object.assign({}, artist, {
    albums: await exportArtistAlbums(artist.id, maxTracks),
    thumb: library.api.getUrl(artist.thumb),
  }))
}

async function exportPlaylistTracks (playlistId, size) {
  const library = await getLibrary()
  const result = await library.playlistTracks(playlistId, {size})
  return convertTracks(result.tracks)
}

async function exportPlaylists (size, maxTracks) {
  const library = await getLibrary()
  const result = await library.playlists({size})
  return Promise.map(result.playlists, async (playlist) => Object.assign({}, playlist, {
    tracks: await exportPlaylistTracks(playlist.id, maxTracks),
    composite: library.api.getUrl(playlist.composite),
  }))
}

async function exportTracks (section, size) {
  const library = await getLibrary()
  const result = await library.tracks(section, {size})
  return convertTracks(result.tracks)
}

async function exportSearch (query, size) {
  const library = await getLibrary()
  const result = await library.searchAll(query, size)
  return result.hubs.map((hub) => Object.assign({}, hub, {
    items: hub.items.map((item) => Object.assign({}, item, {
      thumb: library.api.getUrl(item.thumb),
    })),
  }))
}

async function init () {
  flags.defineString('type', 'albums', 'albums, artists or tracks')
  flags.defineString('query', '', 'search query')
  flags.defineInteger('section', 1, 'ID of the section to export')
  flags.defineInteger('limit', 10, 'Number of items to export')
  flags.defineInteger('max-tracks', 20, 'Number of tracks to export per item')
  flags.parse()

  const type = flags.get('type')
  const section = flags.get('section')
  const limit = flags.get('limit')
  const maxTracks = flags.get('max-tracks')
  const query = flags.get('query')

  let exportedData

  switch (type) {
    case 'albums':
      exportedData = await exportAlbums(section, limit, maxTracks)
      break
    case 'artists':
      exportedData = await exportArtists(section, limit, maxTracks)
      break
    case 'playlists':
      exportedData = await exportPlaylists(limit, maxTracks)
      break
    case 'tracks':
      exportedData = await exportTracks(section, limit)
      break
    case 'search':
      exportedData = await exportSearch(query, limit)
      break
    default:
      throw new Error(`Unsupported type: ${type}`)
  }

  console.log(JSON.stringify(exportedData, null, 2))
}

init().catch((err) => console.error(err))
