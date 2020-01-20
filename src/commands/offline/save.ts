import fs from 'fs'
import { MediaType } from 'perplexed'

import getLibrary from '../../utils/getLibrary'
import getAllSectionItems from '../../iterators/get-all-section-items'
import getAllPlaylists from '../../iterators/get-all-playlists'

interface Options {
  sectionId: number,
  path: string,
}

export const command = 'offline-save'

export const describe = 'Save library data to a local file'

export const builder = {
  'section-id': {
    type: 'number',
    default: 1,
  },
  path: {
    type: 'string',
    required: true,
  },
}

export const handler = async (argv: Options) => {
  const { sectionId, path } = argv

  const library = await getLibrary()

  const stream = fs.createWriteStream(path)

  for await (const playlist of getAllPlaylists({ library })) {
    stream.write(JSON.stringify(playlist) + '\n')
  }

  for await (const track of getAllSectionItems({
    library,
    mediaType: MediaType.TRACK,
    sectionId,
  })) {
    stream.write(JSON.stringify(track) + '\n')
  }

  for await (const track of getAllSectionItems({
    library,
    mediaType: MediaType.ARTIST,
    sectionId,
  })) {
    stream.write(JSON.stringify(track) + '\n')
  }

  for await (const track of getAllSectionItems({
    library,
    mediaType: MediaType.ALBUM,
    sectionId,
  })) {
    stream.write(JSON.stringify(track) + '\n')
  }

  stream.close()
}
