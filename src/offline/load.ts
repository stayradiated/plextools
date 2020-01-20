import fs from 'fs'
import { Artist, Album, Track, Playlist } from 'perplexed'

interface LoadOptions {
  path: string,
}

interface Items {
  albums: Album[],
  artists: Artist[],
  tracks: Track[],
  playlists: Playlist[],
}

const NEW_LINE = 10

const parseLine = (data: Buffer): Artist | Album | Track | Playlist => {
  const json = data.toString('utf8')
  return JSON.parse(json)
}

const load = async (options: LoadOptions) => {
  const { path } = options

  return new Promise<Items>((resolve, reject) => {
    const stream = fs.createReadStream(path)
    let buffer: Buffer = Buffer.alloc(0)

    const items: Items = {
      tracks: [],
      artists: [],
      albums: [],
      playlists: [],
    }

    stream.on('end', () => resolve(items))
    stream.on('error', reject)

    stream.on('data', (bytes) => {
      let counter = 0
      for (let i = 0; i < bytes.length; i += 1) {
        const byte = bytes[i]
        if (byte === NEW_LINE) {
          const line = Buffer.concat([buffer, bytes.slice(counter, i)])
          counter = i + 1
          buffer = Buffer.alloc(0)

          const item = parseLine(line)
          switch (item._type) {
            case 'album':
              items.albums.push(item as Album)
              break
            case 'artist':
              items.artists.push(item as Artist)
              break
            case 'track':
              items.tracks.push(item as Track)
              break
            case 'playlist':
              items.playlists.push(item as Playlist)
              break
          }
        }
      }
      buffer = Buffer.concat([buffer, bytes.slice(counter)])
    })
  })
}

export default load
