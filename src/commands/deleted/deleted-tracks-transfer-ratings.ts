import chalk from 'chalk'
import { MediaType, Track } from 'perplexed'

import getLibrary from '../../utils/getLibrary'
import getAllSectionItems from '../../iterators/get-all-section-items'
import findSimilarTracks, { SimilarTrack } from '../../match'
import { printTrackDifference, printMissingTrack } from '../../print/track'
import load from '../../offline/load'

interface Options {
  sectionId: number,
  offlinePath: string,
}

export const command = 'deleted-tracks-transfer-ratings'

export const describe = 'Transfer ratings from deleted tracks'

export const builder = {
  'section-id': {
    type: 'number',
    default: 1,
  },
  'offline-path': {
    type: 'string',
  },
}

export const handler = async (argv: Options) => {
  const { sectionId, offlinePath } = argv

  let allTracks: Track[] = []
  const library = await getLibrary()

  if (offlinePath) {
    const items = await load({ path: offlinePath })
    allTracks = items.tracks
  } else {
    for await (const track of getAllSectionItems({
      library,
      mediaType: MediaType.TRACK,
      sectionId,
    })) {
      allTracks.push(track as Track)
    }
  }

  const targets = allTracks.filter((track) => {
    return (
      track.deletedAt != null
      // track.userRating != null
    )
  })

  const pendingUpdates = [] as [Track, SimilarTrack][]

  for (let i = 0; i < targets.length; i += 1) {
    const track = targets[i]
    console.log('')

    const similarTracks = findSimilarTracks(track, allTracks)
    const bestTrack = similarTracks[0]

    if (bestTrack == null || bestTrack.similarity < 0.6) {
      printMissingTrack(track)
      printTrackDifference(track, similarTracks.slice(0, 10))
    } else {
      printTrackDifference(track, [bestTrack])
      if (
        track.userRating != null &&
        (bestTrack.userRating == null ||
          bestTrack.userRating < track.userRating)
      ) {
        pendingUpdates.push([track, bestTrack])
      }
    }
  }

  for (const update of pendingUpdates) {
    const [track, bestMatch] = update
    console.log(
      `${chalk.yellow(`[${bestMatch.id}]`)} ${chalk.white(
        bestMatch.title,
      )} from ${chalk.greenBright(bestMatch.userRating)} to ${chalk.green(
        track.userRating,
      )}`,
    )
    await library.rate(bestMatch.id, track.userRating)
  }
}
