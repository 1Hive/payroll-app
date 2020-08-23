import { dateFormat, dayjs } from './date-utils'
import BN from 'bn.js'

export const CHART_TYPES = ['Monthly', 'Quarterly', 'Yearly']

const [MONTHLY, QUARTERLY, YEARLY] = CHART_TYPES
const HISTORY_FORMAT = {
  [MONTHLY]: 'YYYYMM',
  [QUARTERLY]: 'YYYYQ',
  [YEARLY]: 'YYYY',
}

const MAX_PROPORTION = 4 / 5
const MONTHS_AGO = 12
const QUARTERS_AGO = 4
const initialAmounts = {
  denominationAmount: new BN(0),
  equityAmount: new BN(0),
}

// Object whose keys map to a function which generates the initial past year history relative to today
// e.g Current date = MAY2020 => monthly generates from "MAY2020" to "MAY2019" initializing all amounts to zero
//                            => quarterly generates from "Q22020" to "Q22019"
const INITIAL_HISTORY = {
  [MONTHLY]: () => {
    const months = Array.from({ length: MONTHS_AGO + 1 }).map(
      (_, index) => index
    )

    const today = dayjs()

    // Returns all past months a year from today
    return months.reduce((acc, month) => {
      const monthAgo = today.subtract(month, 'month')
      const historyKey = getHistoryKey(monthAgo, MONTHLY)

      // Format month ago
      const monthAgoFormatted = dateFormat(monthAgo, 'MMM').toUpperCase()

      // Add monthly entry to history
      acc[historyKey] = {
        label: monthAgoFormatted,
        ...initialAmounts,
      }

      return acc
    }, {})
  },

  [QUARTERLY]: () => {
    const quarters = Array.from({ length: QUARTERS_AGO + 1 }).map(
      (_, index) => index
    )

    const today = dayjs()

    // Returns all past quarters a year from today
    return quarters.reduce((acc, quarter) => {
      const quarterAgo = today.subtract(quarter, 'quarter')

      const historyKey = getHistoryKey(quarterAgo, QUARTERLY)

      // Format quarter ago
      const formattedYear = dateFormat(quarterAgo, 'YY')
      const formattedQuarter = dateFormat(quarterAgo, 'Q')

      // Add quarter entry to history
      acc[historyKey] = {
        label: `${formattedYear} Q${formattedQuarter}`,
        ...initialAmounts,
      }

      return acc
    }, {})
  },

  [YEARLY]: () => ({}),
}

// Object whose keys map to a function which calculates the acc amount for each time period
const GROUPED_PAYMENTS = {
  [MONTHLY]: payments => {
    const history = INITIAL_HISTORY[MONTHLY]()
    const max = {
      denomination: new BN(0),
      equity: new BN(0),
    }

    payments.forEach(({ date, denominationAmount, equityAmount }) => {
      const paymentDate = dayjs(date)
      const key = getHistoryKey(paymentDate, MONTHLY)

      const newDenominationAmount = history[key].denominationAmount.add(
        denominationAmount
      )
      const newEquityAmount = history[key].equityAmount.add(equityAmount)

      // Update amounts
      history[key].denominationAmount = newDenominationAmount
      history[key].equityAmount = newEquityAmount

      // Update maxs if necessary
      if (newDenominationAmount.gt(max.denomination)) {
        max.denomination = newDenominationAmount
      }

      if (newEquityAmount.gt(max.equity)) {
        max.equity = newEquityAmount
      }
    })

    return { max, history }
  },

  [QUARTERLY]: payments => {
    const history = INITIAL_HISTORY[QUARTERLY]()
    const max = {
      denomination: new BN(0),
      equity: new BN(0),
    }

    payments.forEach(({ date, denominationAmount, equityAmount }) => {
      const paymentDate = dayjs(date)
      const key = getHistoryKey(paymentDate, QUARTERLY)

      const newDenominationAmount = history[key].denominationAmount.add(
        denominationAmount
      )
      const newEquityAmount = history[key].equityAmount.add(equityAmount)

      // Update amounts
      history[key].denominationAmount = newDenominationAmount
      history[key].equityAmount = newEquityAmount

      // Update maxs if necessary
      if (newDenominationAmount.gt(max.denomination)) {
        max.denomination = newDenominationAmount
      }

      if (newEquityAmount.gt(max.equity)) {
        max.equity = newEquityAmount
      }
    })

    return { max, history }
  },

  [YEARLY]: payments => {
    const history = INITIAL_HISTORY[YEARLY]()
    const max = {
      denomination: new BN(0),
      equity: new BN(0),
    }

    payments.forEach(({ date, denominationAmount, equityAmount }) => {
      const paymentDate = dayjs(date)
      const key = getHistoryKey(paymentDate, YEARLY)

      if (!history[key]) {
        history[key] = {
          label: key,
          ...initialAmounts,
        }
      }

      const newDenominationAmount = history[key].denominationAmount.add(
        denominationAmount
      )
      const newEquityAmount = history[key].equityAmount.add(equityAmount)

      // Update amounts
      history[key].denominationAmount = newDenominationAmount
      history[key].equityAmount = newEquityAmount

      // Update maxs if necessary
      if (newDenominationAmount.gt(max.denomination)) {
        max.denomination = newDenominationAmount
      }

      if (newEquityAmount.gt(max.equity)) {
        max.equity = newEquityAmount
      }
    })

    return { max, history }
  },
}

const LABELS = {
  [MONTHLY]: (sorted, history) =>
    sorted.map((key, i) =>
      i > 0 && i < sorted.length - 1 ? history[key].label : ''
    ),
  [QUARTERLY]: (sorted, history) =>
    [''].concat(sorted.map(key => history[key].label).slice(1)),
  [YEARLY]: (sorted, history) =>
    [''].concat(sorted.map(key => history[key].label)),
}

function calculateProportion(max, value) {
  if (max.isZero()) {
    return 0
  }

  return (value * MAX_PROPORTION) / max
}

function getHistoryKey(date, type) {
  return dateFormat(date, HISTORY_FORMAT[type])
}

export function chartSettings(type, payments) {
  const { max, history } = GROUPED_PAYMENTS[type](payments)

  const sorted = Object.keys(history).sort() // The default sort order is built upon converting the elements into strings, then comparing their sequences of UTF-16 code units values.
  const initialValue = type === YEARLY ? [0] : [] // chart will start on 0 when is yearly

  const settings = {
    denominationAmountValues: initialValue.concat(
      sorted.map(key =>
        calculateProportion(max.denomination, history[key].denominationAmount)
      )
    ),
    equityAmountValues: initialValue.concat(
      sorted.map(key =>
        calculateProportion(max.equity, history[key].equityAmount)
      )
    ),
  }

  const labels = LABELS[type](sorted, history)

  return { settings, labels }
}
