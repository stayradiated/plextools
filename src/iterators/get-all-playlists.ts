import { Library } from 'perplexed'
import CLIProgress from 'cli-progress'
import throat from 'throat'

const MAX_CONCURRENCY = 5

interface GetPlaylistItemsOptions {
  library: Library,
  playlistId: number,
  start: number,
  size: number,
}

const getPlaylistItems = async (options: GetPlaylistItemsOptions) => {
  const { library, playlistId, start, size } = options
  const playlist = await library.playlistTracks(playlistId, { start, size })
  return playlist.items
}

interface GetAllPlaylistsOptions {
  library: Library,
  size?: number,
}

async function * getAllPlaylists (options: GetAllPlaylistsOptions) {
  const { library, size = 1000 } = options

  const bar = new CLIProgress.SingleBar({}, CLIProgress.Presets.shades_classic)

  const playlistContainer = await library.playlists()

  bar.start(playlistContainer.playlists.length, 0)

  const throttledGetPlaylistItems = throat(MAX_CONCURRENCY, getPlaylistItems)

  const promises = playlistContainer.playlists.map(async (playlist) => {
    const requestCount = Math.ceil(playlist.leafCount / size)
    const items = (
      await Promise.all(
        [...new Array(requestCount).keys()].map((key) => {
          const start = key * size
          return throttledGetPlaylistItems({
            library,
            playlistId: playlist.id,
            start,
            size,
          })
        }),
      )
    ).flat()
    playlist.items = items
    return playlist
  })

  for (const promise of promises) {
    const playlist = await promise
    bar.increment(1)
    yield playlist
  }

  bar.stop()
}

export default getAllPlaylists
