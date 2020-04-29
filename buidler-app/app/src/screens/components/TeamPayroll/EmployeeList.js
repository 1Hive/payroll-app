import React, { useCallback } from 'react'

import EmployeeTable from './EmployeeTable'
import { formatCurrency, SECONDS_IN_A_YEAR } from '../../../utils/formatting'
import { useTotalPayrollData } from '../TotalPayroll'
import useFilteredEmployees from './useFilteredEmployees'

function EmployeeList() {
  const {
    parsedEmployees: employees,
    denominationToken,
  } = useTotalPayrollData()

  const {
    emptyResultsViaFilters,
    filteredEmployees,
    filters,
    handleClearFilters,
    handleRoleChange,
    handleStatusChange,
    selectedRole,
    selectedStatus,
  } = useFilteredEmployees(employees)

  const customSalaryFormat = useCallback(
    amount =>
      formatCurrency(
        amount,
        denominationToken.symbol,
        10,
        denominationToken.decimals,
        SECONDS_IN_A_YEAR
      ),
    []
  )
  const customCurrencyFormat = useCallback(
    amount => formatCurrency(amount, denominationToken.symbol, 10, 0),
    []
  )

  return (
    <EmployeeTable
      emptyResultsViaFilters={emptyResultsViaFilters}
      employees={employees}
      filteredEmployees={filteredEmployees}
      formatSalary={customSalaryFormat}
      formatCurrency={customCurrencyFormat}
      filters={filters}
      onClearFilters={handleClearFilters}
      onRoleChange={handleRoleChange}
      onStatusChange={handleStatusChange}
      selectedRole={selectedRole}
      selectedStatus={selectedStatus}
    />
  )
}

export default EmployeeList
