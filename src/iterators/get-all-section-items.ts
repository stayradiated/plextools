import {
  Library,
  MediaType,
  AlbumContainer,
  ArtistContainer,
  PlaylistContainer,
  TrackContainer,
} from 'perplexed'
import CLIProgress from 'cli-progress'
import throat from 'throat'

const MAX_CONCURRENCY = 5

interface GetTotalSizeOptions {
  library: Library,
  sectionId: number,
  mediaType: MediaType,
}

const getTotalSize = async (options: GetTotalSizeOptions) => {
  const { library, sectionId, mediaType } = options
  const result = await library.sectionItems(sectionId, mediaType, {
    start: 0,
    size: 0,
  })
  return result.totalSize
}

interface GetSectionItemsOptions {
  library: Library,
  sectionId: number,
  mediaType: MediaType,
  start: number,
  size: number,
}

const getSectionItems = async (options: GetSectionItemsOptions) => {
  const { library, sectionId, mediaType, start, size } = options

  const result = await library.sectionItems(sectionId, mediaType, {
    start,
    size,
  })

  switch (mediaType) {
    case MediaType.ALBUM:
      return (result as AlbumContainer).albums
    case MediaType.ARTIST:
      return (result as ArtistContainer).artists
    case MediaType.PLAYLIST:
      return (result as PlaylistContainer).playlists
    case MediaType.TRACK:
      return (result as TrackContainer).tracks
  }
}

interface GetAllSectionItemsOptions {
  library: Library,
  sectionId: number,
  mediaType: MediaType,
  size?: number,
}

async function * getAllSectionItems (options: GetAllSectionItemsOptions) {
  const { library, sectionId, mediaType, size = 1000 } = options

  const totalSize = await getTotalSize({ library, sectionId, mediaType })

  const start = 0

  const bar = new CLIProgress.SingleBar({}, CLIProgress.Presets.shades_classic)

  bar.start(totalSize, start, { filename: MediaType[mediaType] })

  const requestCount = Math.ceil(totalSize / size)

  const throttledGetSectionItems = throat(MAX_CONCURRENCY, getSectionItems)

  const promises = [...new Array(requestCount).keys()].map((key) => {
    const start = key * size

    return throttledGetSectionItems({
      library,
      sectionId,
      mediaType,
      start,
      size,
    })
  })

  for (const promise of promises) {
    const items = await promise
    bar.increment(items.length)
    for (const item of items) {
      yield item
    }
  }

  bar.stop()
}

export default getAllSectionItems
