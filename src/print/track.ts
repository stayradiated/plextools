import chalk from 'chalk'
import { Duration } from 'luxon'
import { Track } from 'perplexed'

import { SimilarTrack } from '../match'

const SEP = chalk.gray(' | ')

const formatDuration = (milliseconds: number) => {
  return Duration.fromObject({ milliseconds }).toFormat('m:ss')
}

interface PrintTrackOptions {
  trackSize?: number,
  albumSize?: number,
  artistSize?: number,
}

const printTrack = (track: Track, options: PrintTrackOptions = {}) => {
  const {
    trackSize = track.title.length,
    albumSize = track.parentTitle.length,
    artistSize = track.grandparentTitle.length,
  } = options
  console.log(
    `${''.padEnd(5)}${SEP}${chalk.yellow(
      track.id.toString().padEnd(7),
    )}${SEP}${chalk.blue(
      track.grandparentTitle.padEnd(artistSize),
    )}${SEP}${chalk.green(
      track.parentTitle.padEnd(albumSize),
    )}${SEP}${track.title.padEnd(trackSize)}${SEP}${chalk.cyan(
      formatDuration(track.duration),
    )}${SEP}${chalk.red(track.userRating || '?')}${chalk.redBright('/10')}`,
  )
}

const printSimilarTrack = (track: SimilarTrack, options: PrintTrackOptions) => {
  const { trackSize, albumSize, artistSize } = options
  const { similarity } = track
  const similarityColor = (() => {
    switch (true) {
      case similarity === 1.0:
        return chalk.green
      case similarity >= 0.9:
        return chalk.greenBright
      case similarity >= 0.8:
        return chalk.inverse.blue
      case similarity >= 0.5:
        return chalk.inverse.blueBright
      case similarity >= 0.3:
        return chalk.inverse.redBright
      default:
        return chalk.inverse.red
    }
  })()
  console.log(
    `${similarityColor(
      (Math.round(similarity * 100) / 100).toFixed(2).padEnd(5),
    )}${SEP}${chalk.yellowBright(
      track.id.toString().padEnd(7),
    )}${SEP}${chalk.blueBright(
      track.grandparentTitle.padEnd(artistSize),
    )}${SEP}${chalk.greenBright(
      track.parentTitle.padEnd(albumSize),
    )}${SEP}${chalk.white(
      track.title.padEnd(trackSize),
    )}${SEP}${chalk.cyanBright(
      formatDuration(track.duration),
    )}${SEP}${chalk.red(track.userRating || '?')}${chalk.redBright('/10')}`,
  )
}

const printMissingTrack = (track: Track) => {
  console.log(
    `${''.padEnd(5)}${SEP}${chalk.bgRed(
      '??? No Match Found',
    )}${SEP}${formatDuration(track.duration)}`,
  )
}

const printTrackDifference = (needle: Track, matches: SimilarTrack[]) => {
  const artistSize = Math.max(
    needle.grandparentTitle.length,
    ...matches.map((t) => t.grandparentTitle.length),
  )
  const albumSize = Math.max(
    needle.parentTitle.length,
    ...matches.map((t) => t.parentTitle.length),
  )
  const trackSize = Math.max(
    needle.title.length,
    ...matches.map((t) => t.title.length),
  )

  printTrack(needle, { artistSize, albumSize, trackSize })
  matches.forEach((t) =>
    printSimilarTrack(t, { artistSize, albumSize, trackSize }),
  )
}

export { printTrack, printTrackDifference, printMissingTrack }
