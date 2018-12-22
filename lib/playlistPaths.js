const {normalize} = require('perplexed')

const getLibrary = require('./getLibrary')

async function getPlaylistTracks (library, id) {
  const {entities} = await normalize(
    library.playlistTracks(id, {size: 50}))

  const playlist = entities.playlists[id]
  const tracks = playlist.items
    .map((item) => entities.tracks[item.track])

  return tracks
}

async function playlistPaths (playlistId) {
  const library = await getLibrary()
  const tracks = await getPlaylistTracks(library, playlistId)
  const fileList = tracks.map((track) => {
    if (track.media.length === 0) {
      return ''
    }
    if (track.media[0].parts == null) {
      return ''
    }
    return track.media[0].parts[0].file
  })
  console.log(fileList.join('\n'))
}

module.exports = playlistPaths
