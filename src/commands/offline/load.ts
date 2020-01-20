import load from '../../offline/load'

interface Options {
  path: string,
}

export const command = 'offline-load'

export const describe = 'Load library data from a local file'

export const builder = {
  path: {
    type: 'string',
    required: true,
  },
}

export const handler = async (argv: Options) => {
  const { path } = argv

  const items = await load({ path })

  console.log(`${items.playlists.length} playlists`)
  console.log(`${items.artists.length} artists`)
  console.log(`${items.albums.length} albums`)
  console.log(`${items.tracks.length} tracks`)
}
