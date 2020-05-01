import { useCallback, useMemo, useState } from 'react'
import { dateIsBetween } from '../../../utils/date-utils'
import { useAppState } from '@aragon/api-react'
import { addressesEqual } from '../../../utils/web3-utils'

const UNSELECTED_DATE_RANGE_FILTER = { start: null, end: null }

function useFilteredPayments() {
  const { payments = [], connectedAccount } = useAppState()

  const [selectedDateRange, setSelectedDateRange] = useState(
    UNSELECTED_DATE_RANGE_FILTER
  )

  const handleSelectedDateRangeChange = useCallback(range => {
    setSelectedDateRange(range)
  }, [])

  const handleClearFilters = useCallback(() => {
    setSelectedDateRange(UNSELECTED_DATE_RANGE_FILTER)
  }, [])

  const currentEmployeePayments = useMemo(
    () =>
      payments.filter(({ accountAddress }) =>
        addressesEqual(accountAddress, connectedAccount)
      ),
    [payments]
  )

  const filteredPayments = useMemo(
    () =>
      currentEmployeePayments.filter(({ date, accountAddress }) => {
        if (!addressesEqual(accountAddress, connectedAccount)) {
          return false
        }

        if (
          selectedDateRange.start &&
          selectedDateRange.end &&
          !dateIsBetween(date, selectedDateRange.start, selectedDateRange.end)
        ) {
          return false
        }
        return true
      }),
    [currentEmployeePayments]
  )

  const emptyResultsViaFilters =
    filteredPayments.length === 0 && selectedDateRange.start

  return {
    currentEmployeePayments,
    emptyResultsViaFilters,
    filteredPayments,
    handleClearFilters,
    handleSelectedDateRangeChange,
    selectedDateRange,
  }
}

export default useFilteredPayments
