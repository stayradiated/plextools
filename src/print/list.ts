import chalk from 'chalk'

const BULLET = '•'

const bulletListItem = (text: string) => {
  return ` ${chalk.gray(BULLET)} ${text}`
}

export { bulletListItem }
