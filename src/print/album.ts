import chalk from 'chalk'
import { Album } from 'perplexed'

const SEP = chalk.gray(' | ')

const printAlbum = (album: Album) => {
  const { title, parentTitle, year, guid } = album

  console.log(
    `${chalk.yellow(guid)}${SEP}${chalk.blue(parentTitle)}${SEP}${chalk.green(
      title,
    )}${SEP}${chalk.magenta(year)}`,
  )
}

export default printAlbum
