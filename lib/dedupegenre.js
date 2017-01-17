const getLibrary = require('./getLibrary')

async function fixGenre () {
  const lib = await getLibrary()

  try {
    await lib.modifyAlbumGenre(1, 42039, ['Modern Jazz', 'Jazz'], ['Modern Jazz'])
  } catch (err) {
    console.log(err)
  }
  console.log('Success!')
}

fixGenre()
