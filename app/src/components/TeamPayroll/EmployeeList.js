import React from 'react'

import EmployeeTable from './EmployeeTable'
import { useTotalPayrollData } from '../../hooks/payroll-hooks'
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

  return (
    <EmployeeTable
      emptyResultsViaFilters={emptyResultsViaFilters}
      employees={employees}
      filteredEmployees={filteredEmployees}
      filters={filters}
      onClearFilters={handleClearFilters}
      onRoleChange={handleRoleChange}
      onStatusChange={handleStatusChange}
      selectedRole={selectedRole}
      selectedStatus={selectedStatus}
      token={denominationToken}
    />
  )
}

export default EmployeeList