import chalk from 'chalk'

import getLibrary from '../../utils/getLibrary'

interface Options {
  sectionId: number,
}

export const command = 'deleted-albums'

export const describe = 'List deleted albums'

export const builder = {
  'section-id': {
    type: 'number',
    default: 1,
  },
}

export const handler = async (argv: Options) => {
  const { sectionId } = argv

  const library = await getLibrary()
  const result = await library.albums(sectionId)

  result.albums
    .filter((album) => album.deletedAt != null)
    .forEach((album) => {
      console.log(
        `${chalk.green(album.parentTitle)} ${chalk.gray('-')} ${album.title}`,
      )
    })
}
