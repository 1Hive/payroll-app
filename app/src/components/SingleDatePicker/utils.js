import { dayjs } from '../../utils/date-utils'

function handleSingleDateSelect({ date, startDate }) {
  // clicking on start date resets it, so it can be re-picked
  if (startDate && dayjs(date).isSame(startDate, 'day')) {
    return {
      startDate: null,
    }
  }
  // if we have startDate, then `date` is the end date
  const isValidDate = true

  if (isValidDate) {
    return {
      [(startDate = 'startDate')]: date,
    }
  }
}

export default handleSingleDateSelect
