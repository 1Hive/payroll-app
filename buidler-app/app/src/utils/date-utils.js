import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import relativeTime from 'dayjs/plugin/relativeTime'
import BN from 'bn.js'

export const SECOND = 1000
export const MINUTE = 60 * SECOND
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

export const SECONDS_IN_A_YEAR = new BN((365 * DAY) / 1000)

const KNOWN_FORMATS = {
  onlyDate: 'DD/MM/YYYY',
  iso: 'YYYY-MM-DD',
}

// dayjs plugins
dayjs.extend(isBetween)
dayjs.extend(relativeTime)

function dateFormat(date, format = 'onlyDate') {
  return dayjs(date).format(KNOWN_FORMATS[format] || format)
}

export { dayjs, dateFormat }
