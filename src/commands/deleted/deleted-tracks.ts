import { Track, MediaType } from 'perplexed'

import getLibrary from '../../utils/getLibrary'
import getAllSectionItems from '../../iterators/get-all-section-items'
import { printTrack } from '../../print/track'

interface Options {
  sectionId: number,
}

export const command = 'deleted-tracks'

export const describe = 'List deleted tracks'

export const builder = {
  'section-id': {
    type: 'number',
    default: 1,
  },
}

export const handler = async (argv: Options) => {
  const { sectionId } = argv

  const library = await getLibrary()

  const deletedTracks = [] as Track[]

  for await (const item of getAllSectionItems({
    library,
    mediaType: MediaType.TRACK,
    sectionId,
  })) {
    const track = item as Track
    if (track.deletedAt != null) {
      deletedTracks.push(track)
    }
  }
  deletedTracks.forEach((track) => printTrack(track))
}
