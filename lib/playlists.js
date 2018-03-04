const {normalize} = require('perplexed')

const getLibrary = require('./getLibrary')

async function getPlaylistTracks (library, id) {
  const {entities} = await normalize(
    library.playlistTracks(id, {size: 50}))

  const playlist = entities.playlists[id]
  const tracks = playlist.tracks
    .map((trackId) => entities.tracks[trackId])

  return tracks
}

async function getPlaylists (library) {
  const {result, entities} = await normalize(library.playlists())

  return result.id.playlists
    .map((id) => entities.playlists[id])
}

async function findAndPrintPlaylist (name) {
  const library = await getLibrary()
  const playlists = await getPlaylists(library)
  const playlist = playlists.find((p) => p.title.includes(name))
  const tracks = await getPlaylistTracks(library, playlist.id)
  tracks.forEach((track) => console.log(track.media[0].part[0].file))
}

findAndPrintPlaylist('000 George')
