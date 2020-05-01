import React from 'react'
import SalaryTable from './SalaryTable'
import useFilteredPayments from './useFilteredPayments'

const PreviousSalary = React.memo(() => {
  const {
    currentEmployeePayments,
    emptyResultsViaFilters,
    filteredPayments,
    handleClearFilters,
    handleSelectedDateRangeChange,
    selectedDateRange,
  } = useFilteredPayments()

  return (
    <SalaryTable
      emptyResultsViaFilters={emptyResultsViaFilters}
      filteredPayments={filteredPayments}
      onClearFilters={handleClearFilters}
      onSelectDateRange={handleSelectedDateRangeChange}
      payments={currentEmployeePayments}
      selectedDateRange={selectedDateRange}
    />
  )
})

export default PreviousSalary
