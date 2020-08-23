import { useCallback, useMemo, useState } from 'react'
import { useAppState, useConnectedAccount } from '@aragon/api-react'
import { dateIsBetween } from '../../utils/date-utils'
import { addressesEqual } from '../../utils/web3-utils'

const UNSELECTED_DATE_RANGE_FILTER = { start: null, end: null }
const UNSELECTED_TOKEN_FILTER = -1

function useFilteredPayments() {
  const { payments = [] } = useAppState()
  const connectedAccount = useConnectedAccount()

  const [selectedDateRange, setSelectedDateRange] = useState(
    UNSELECTED_DATE_RANGE_FILTER
  )
  const [selectedToken, setSelectedToken] = useState(UNSELECTED_TOKEN_FILTER)

  const handleSelectedDateRangeChange = useCallback(range => {
    setSelectedDateRange(range)
  }, [])

  const handleTokenChange = useCallback(index => {
    const tokenIndex = index === 0 ? UNSELECTED_TOKEN_FILTER : index
    setSelectedToken(tokenIndex)
  }, [])

  const handleClearFilters = useCallback(() => {
    setSelectedDateRange(UNSELECTED_DATE_RANGE_FILTER)
  }, [])

  const currentEmployeePayments = useMemo(
    () =>
      payments.filter(({ accountAddress }) =>
        addressesEqual(accountAddress, connectedAccount)
      ),
    [connectedAccount, payments]
  )

  const tokens = ['All', ...new Set(payments.map(({ token }) => token.symbol))]

  const filteredPayments = useMemo(
    () =>
      currentEmployeePayments.filter(({ date }) => {
        if (
          selectedDateRange.start &&
          selectedDateRange.end &&
          !dateIsBetween(date, selectedDateRange.start, selectedDateRange.end)
        ) {
          return false
        }
        return true
      }),
    [currentEmployeePayments, selectedDateRange]
  )

  const emptyResultsViaFilters =
    filteredPayments.length === 0 &&
    (selectedToken > 0 || Boolean(selectedDateRange.start))

  return {
    currentEmployeePayments,
    emptyResultsViaFilters,
    filteredPayments,
    handleClearFilters,
    handleSelectedDateRangeChange,
    handleTokenChange,
    selectedDateRange,
    selectedToken,
    tokens,
  }
}

export default useFilteredPayments
