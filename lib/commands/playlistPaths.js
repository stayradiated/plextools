const {normalize} = require('perplexed')

const getLibrary = require('../utils/getLibrary')

exports.command = 'playlist <playlist-id> paths'
exports.describe = 'Print a playlist as a list of filepaths'
exports.builder = {
  playlistId: {
    describe: 'The ID of the playlist'
  }
}

async function getPlaylistTracks (library, id) {
  const {entities} = await normalize(
    library.playlistTracks(id, {size: 50}))

  const playlist = entities.playlists[id]
  const tracks = playlist.items
    .map((item) => entities.tracks[item.track])

  return tracks
}

exports.handler = async (argv) => {
  const { playlistId } = argv

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
