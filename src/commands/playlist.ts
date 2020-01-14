import { Argv } from 'yargs'

exports.command = 'playlist <command>'

exports.desc = 'Manage a playlist'

exports.builder = function (yargs: Argv) {
  return yargs.commandDir('./playlist_cmds')
}
