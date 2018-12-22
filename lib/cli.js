const yargs = require('yargs')

const playlistPaths = require('./playlistPaths')
const fixGenreTags = require('./fixGenreTags')
const playlistLyrics = require('./lyrics')

const argv = yargs
  .strict()
  .demandCommand(1, 'You need to select at least one command to use this tool')
  .command('playlist-paths', 'Print a playlist as a list of filepaths', (yargs) => {
    yargs
      .strict()
      .option('playlist-id', {
        alias: 'p',
        describe: 'The ID of the playlist',
      })
      .demand(['playlist-id'])
  })
  .command('fix-genre-tags', 'Split combined genre tags into seperate genres')
  .command('playlist-lyrics', 'Display lyrics')
  .parse()

async function start () {
  switch (argv._[0]) {
    case 'playlist-paths':
      await playlistPaths(argv.playlistId)
      break
    case 'fix-genre-tags':
      await fixGenreTags()
      break
    case 'playlist-lyrics':
      await playlistLyrics()
      break
    default:
      console.log('New command', argv._[0])
      break
  }
}

start()
  .catch(console.log)
