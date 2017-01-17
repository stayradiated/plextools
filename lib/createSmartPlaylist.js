const getLibrary = require('./getLibrary')

async function createSmartPlaylist () {
  const library = await getLibrary()
  const {sections} = await library.sections()
  const {uuid} = sections[0]

  const uri = library.buildLibraryURI(uuid, '/library/sections/1/all', {
    userRating: '-1',
    sort: 'addedAt:desc',
    sourceType: 10,
  })

  const result = await library.createSmartPlaylist('Unrated', uri)
  const playlist = result.playlists[0]
  console.log(`Creating playlist: ${playlist.title} with ${playlist.leafCount} tracks`)
}

createSmartPlaylist()
