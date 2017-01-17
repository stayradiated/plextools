const {normalize} = require('perplexed')

const getLibrary = require('./getLibrary')

async function printPlaylistTracks (library, id) {
  const {entities} = await normalize(
    library.playlistTracks(id, {size: 10}))

  const playlist = entities.playlists[id]
  const tracks = playlist.tracks
    .map((trackId) => entities.tracks[trackId])

  console.log(`\n# ${playlist.title} (${playlist.totalSize} tracks)`)
  tracks.forEach((track) => console.log(` - ${track.title}`))
}

async function getPlaylists () {
  const library = await getLibrary()
  const {result, entities} = await normalize(library.playlists())

  result.id.playlists
    .map((id) => entities.playlists[id])
    .forEach((playlist) => printPlaylistTracks(library, playlist.id))
}

getPlaylists()
