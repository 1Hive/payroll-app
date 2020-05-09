import { useCallback, useMemo, useState } from 'react'
import { useAppState, useConnectedAccount } from '@aragon/api-react'
import { addressesEqual } from '../../utils/web3-utils'

const UNSELECTED_DATE = null
const UNSELECTED_TOKEN_FILTER = -1

function useFilteredPayments() {
  const { payments = [] } = useAppState()
  const connectedAccount = useConnectedAccount()

  const [selectedDate, setSelectedDate] = useState(UNSELECTED_DATE)
  const [selectedToken, setSelectedToken] = useState(UNSELECTED_TOKEN_FILTER)

  const handleSelectedDateChange = useCallback((date) => {
    setSelectedDate(date)
  }, [])

  const handleTokenChange = useCallback((index) => {
    const tokenIndex = index === 0 ? UNSELECTED_TOKEN_FILTER : index
    setSelectedToken(tokenIndex)
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
        if (selectedDate) {
          return false
        }
        return true
      }),
    [currentEmployeePayments, selectedDate]
  )

  const emptyResultsViaFilters =
    filteredPayments.length === 0 &&
    (selectedToken > 0 || Boolean(selectedDate))

  return {
    currentEmployeePayments,
    emptyResultsViaFilters,
    filteredPayments,
    handleSelectedDateChange,
    handleTokenChange,
    selectedDate,
    selectedToken,
    tokens,
  }
}

export default useFilteredPayments
