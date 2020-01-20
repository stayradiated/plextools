import { Track, Playlist, MediaType } from 'perplexed'

import load from '../../offline/load'
import getLibrary from '../../utils/getLibrary'
import getAllPlaylists from '../../iterators/get-all-playlists'
import getAllSectionItems from '../../iterators/get-all-section-items'
import { fmtHeading1 } from '../../print/headings'
import { printTrackDifference, printMissingTrack } from '../../print/track'
import findSimilarTracks from '../../match'

interface Options {
  sectionId: number,
  offlinePath: string,
}

export const command = 'deleted-playlist-items'

export const describe = 'List deleted items in playlists'

export const builder = {
  'section-id': {
    type: 'number',
    default: 1,
  },
  'offline-path': {
    type: 'string',
  },
}

export const handler = async (options: Options) => {
  const { sectionId, offlinePath } = options

  let allTracks: Track[] = []
  let allPlaylists: Playlist[] = []

  if (offlinePath) {
    const items = await load({ path: offlinePath })
    allPlaylists = items.playlists
    allTracks = items.tracks
  } else {
    const library = await getLibrary()

    for await (const playlist of getAllPlaylists({ library })) {
      allPlaylists.push(playlist)
    }
    for await (const track of getAllSectionItems({
      library,
      mediaType: MediaType.TRACK,
      sectionId,
    })) {
      allTracks.push(track as Track)
    }
  }

  const pendingUpdates = [] as [Playlist, Track][]

  for (const playlist of allPlaylists) {
    if (playlist.smart) {
      continue
    }

    const deletedTracks = playlist.items
      .map((item) => item.track)
      .filter((track) => track.deletedAt != null)

    const hasMissingTracks = playlist.leafCount > playlist.items.length

    if (deletedTracks.length > 0 || hasMissingTracks) {
      console.log()
      console.log(
        fmtHeading1(
          `${playlist.title} [${playlist.items.length}/${playlist.leafCount}]`,
        ),
      )
      for (const track of deletedTracks) {
        const similarTracks = findSimilarTracks(track, allTracks)
        const bestTrack = similarTracks[0]

        if (bestTrack == null || bestTrack.similarity < 0.6) {
          printMissingTrack(track)
          printTrackDifference(track, similarTracks.slice(0, 10))
        } else {
          printTrackDifference(track, [bestTrack])

          const exists = !!playlist.items.find((item) => {
            return item.track.id === bestTrack.id
          })

          if (exists === false) {
            pendingUpdates.push([playlist, bestTrack])
          }
        }
      }
    }
  }

  if (offlinePath != null) {
    console.log('Running in --offline mode...')
  } else {
    const library = await getLibrary()
    const section = await library.section(sectionId)

    for (const [playlist, track] of pendingUpdates) {
      const source = track.key
      const path = encodeURIComponent(source)
      const uri = `library://${section.uuid}/item/${path}`

      await library.addToPlaylist(playlist.id, uri)
    }
  }
}
