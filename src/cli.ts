import yargs from 'yargs'

yargs
  .strict()
  .demandCommand(1, 'You need to select at least one command to use this tool')
  .commandDir('./commands', {
    recurse: true,
  })
  .parse()
