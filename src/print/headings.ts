import termSize from 'term-size'
import chalk from 'chalk'

const CHAR = '─'

const fmtHeading1 = (text: string, leftPad = 5): string => {
  const { columns } = termSize()

  const left = ''.padStart(leftPad, CHAR)
  const right = ''.padStart(columns - (leftPad + text.length + 2), CHAR)

  const title = `${chalk.yellowBright(left)} ${chalk.yellow(
    text,
  )} ${chalk.yellowBright(right)}`

  return title
}

export { fmtHeading1 }
