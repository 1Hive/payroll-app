import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import relativeTime from 'dayjs/plugin/relativeTime'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import advancedFormat from 'dayjs/plugin/advancedFormat'

const KNOWN_FORMATS = {
  onlyDate: 'DD/MM/YYYY',
  iso: 'YYYY-MM-DD',
}

// dayjs plugins
dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(relativeTime)
dayjs.extend(quarterOfYear)
dayjs.extend(advancedFormat)

function dateFormat(date, format = 'onlyDate') {
  return dayjs(date).format(KNOWN_FORMATS[format] || format)
}

function dateIsBetween(date, start, end) {
  return dayjs(date).isBetween(
    dayjs(start).startOf('day'),
    dayjs(end).endOf('day'),
    null,
    '[]'
  )
}

function durationTime(seconds) {
  return dayjs.duration(seconds, 'seconds').humanize()
}

export { dayjs, dateFormat, dateIsBetween, durationTime }
