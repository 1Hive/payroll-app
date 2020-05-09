import React from 'react'
import PaymentsTable from './PaymentsTable'
import useFilteredPayments from './useFilteredPayments'

function PreviousSalary() {
  const {
    currentEmployeePayments,
    emptyResultsViaFilters,
    filteredPayments,
    handleClearFilters,
    handleSelectedDateChange,
    handleTokenChange,
    selectedDate,
    selectedToken,
    tokens,
  } = useFilteredPayments()

  return (
    <PaymentsTable
      emptyResultsViaFilters={emptyResultsViaFilters}
      filteredPayments={filteredPayments}
      onClearFilters={handleClearFilters}
      onSelectDate={handleSelectedDateChange}
      onSelectToken={handleTokenChange}
      payments={currentEmployeePayments}
      selectedDate={selectedDate}
      selectedToken={selectedToken}
      tokens={tokens}
    />
  )
}

export default React.memo(PreviousSalary)
