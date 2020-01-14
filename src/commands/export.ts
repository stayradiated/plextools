import { Track } from 'perplexed'

import getLibrary from '../utils/getLibrary'

export const command = 'export'

export const describe = ''

interface Options {
  type: string,
  query: string,
  section: number,
  limit: number,
  maxTracks: number,
}

export const builder = {
  type: {
    type: 'string',
    default: 'albums',
    choices: ['albums', 'artists', 'tracks', 'playlists', 'search'],
  },
  query: {
    type: 'string',
    default: '',
    describe: 'Search query',
  },
  section: {
    type: 'number',
    default: 1,
    describe: 'ID of the section to export',
  },
  limit: {
    type: 'number',
    default: 10,
    describe: 'Number of itmes to export',
  },
  maxTracks: {
    type: 'number',
    defualt: 20,
    describe: 'Number of tracks to export per item',
  },
}

async function convertTracks (tracks: Track[]) {
  const library = await getLibrary()
  return tracks.map((track) => ({
    ...track,
    parentThumb: library.api.getUrl(track.parentThumb),
    thumb: library.api.getUrl(track.thumb),
    mediaPath: library.api.getUrl(track.media[0].parts[0].key),
  }))
}

async function exportAlbumTracks (albumId: number, size: number) {
  const library = await getLibrary()
  const result = await library.albumTracks(albumId, { size })
  return convertTracks(result.tracks)
}

async function exportAlbums (section: number, size: number, maxTracks: number) {
  const library = await getLibrary()
  const result = await library.albums(section, { size })

  return Promise.all(
    result.albums.map(async (album) => ({
      ...album,
      tracks: await exportAlbumTracks(album.id, maxTracks),
      thumb: library.api.getUrl(album.thumb),
    })),
  )
}

async function exportArtistAlbums (artistId: number, maxTracks: number) {
  const library = await getLibrary()
  const result = await library.artistAlbums(artistId, {})
  return Promise.all(
    result.albums.map(async (album) => ({
      ...album,
      tracks: await exportAlbumTracks(album.id, maxTracks),
      thumb: library.api.getUrl(album.thumb),
    })),
  )
}

async function exportArtists (section: number, size: number, maxTracks: number) {
  const library = await getLibrary()
  const result = await library.artists(section, { size })
  return Promise.all(
    result.artists.map(async (artist) => ({
      ...artist,
      albums: await exportArtistAlbums(artist.id, maxTracks),
      thumb: library.api.getUrl(artist.thumb),
    })),
  )
}

async function exportPlaylistTracks (playlistId: number, size: number) {
  const library = await getLibrary()
  const result = await library.playlistTracks(playlistId, { size })
  return convertTracks(result.items.map((item) => item.track))
}

async function exportPlaylists (size: number, maxTracks: number) {
  const library = await getLibrary()
  const result = await library.playlists({ size })
  return Promise.all(
    result.playlists.map(async (playlist) => ({
      ...playlist,
      items: await exportPlaylistTracks(playlist.id, maxTracks),
      composite: library.api.getUrl(playlist.composite),
    })),
  )
}

async function exportTracks (section: number, size: number) {
  const library = await getLibrary()
  const result = await library.tracks(section, { size })
  return convertTracks(result.tracks)
}

async function exportSearch (query: string, size: number) {
  const library = await getLibrary()
  const result = await library.searchAll(query, size)
  return result.hubs.map((hub) => ({
    ...hub,
    items: hub.items.map((item) => ({
      ...item,
      thumb: library.api.getUrl(item.thumb),
    })),
  }))
}

export const handler = async (argv: Options) => {
  const { type, query, section, limit, maxTracks } = argv

  const exportedData = await (() => {
    switch (type) {
      case 'albums':
        return exportAlbums(section, limit, maxTracks)
      case 'artists':
        return exportArtists(section, limit, maxTracks)
      case 'playlists':
        return exportPlaylists(limit, maxTracks)
      case 'tracks':
        return exportTracks(section, limit)
      case 'search':
        return exportSearch(query, limit)
      default:
        throw new Error(`Unsupported type: ${type}`)
    }
  })()

  console.log(JSON.stringify(exportedData, null, 2))
}
