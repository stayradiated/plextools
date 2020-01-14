import getLibrary from '../utils/getLibrary'

interface Options {
  name: string,
  ratings: string[],
  sectionId: string,
}

export const command = 'create-smart-playlist'

export const describe = 'Create a smart playlist'

export const builder = {
  name: {
    type: 'string',
    required: true,
  },
  ratings: {
    type: 'array',
    required: true
  },
  sectionId: {
    type: 'number',
    default: 1
  }
}

export const handler = async (argv: Options) => {
  const { name, ratings, sectionId } = argv

  const library = await getLibrary()
  const { sections } = await library.sections()
  const { uuid } = sections[0]

  const uri = library.buildLibraryURI(uuid, `/library/sections/${sectionId}/all`, {
    userRating: ratings.join(','),
    sort: 'addedAt:desc',
    sourceType: 10,
  })

  const result = await library.createSmartPlaylist(name, uri)
  const playlist = result.playlists[0]
  console.log(
    `Created playlist: ${playlist.title} with ${playlist.leafCount} tracks`,
  )
}
