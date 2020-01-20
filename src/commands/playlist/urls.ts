import { Library, normalize } from 'perplexed'

import getLibrary from '../../utils/getLibrary'

interface Options {
  playlistId: number,
}

exports.command = 'urls <playlist-id>'
exports.describe = 'Print a playlist as a list of urls'
exports.builder = {
  playlistId: {
    describe: 'The ID of the playlist',
  },
}

async function getPlaylistTracks (library: Library, id: number) {
  const { entities } = await normalize(library.playlistTracks(id, { size: 50 }))

  const playlist = entities.playlists[id]
  const tracks = playlist.items.map((item) => entities.tracks[item.track])

  return tracks
}

exports.handler = async (argv: Options) => {
  const { playlistId } = argv

  const library = await getLibrary()
  const tracks = await getPlaylistTracks(library, playlistId)
  const urlList = tracks.map((track) => {
    return library.trackSrc(track)
  })
  console.log(urlList.join('\n'))
}
