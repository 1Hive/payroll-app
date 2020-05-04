import React from 'react'
import PaymentsTable from './PaymentsTable'
import useFilteredPayments from './useFilteredPayments'

const PreviousSalary = React.memo(() => {
  const {
    currentEmployeePayments,
    emptyResultsViaFilters,
    filteredPayments,
    handleClearFilters,
    handleSelectedDateRangeChange,
    handleTokenChange,
    selectedDateRange,
    selectedToken,
    tokens,
  } = useFilteredPayments()

  return (
    <PaymentsTable
      emptyResultsViaFilters={emptyResultsViaFilters}
      filteredPayments={filteredPayments}
      onClearFilters={handleClearFilters}
      onSelectDateRange={handleSelectedDateRangeChange}
      onSelectToken={handleTokenChange}
      payments={currentEmployeePayments}
      selectedDateRange={selectedDateRange}
      selectedToken={selectedToken}
      tokens={tokens}
    />
  )
})

export default PreviousSalary
