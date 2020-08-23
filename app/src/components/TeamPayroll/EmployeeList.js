import React from 'react'
import { useAppState } from '@aragon/api-react'
import EmployeeTable from './EmployeeTable'
import { useParsedEmployees } from '../../hooks/payroll-hooks'
import useFilteredEmployees from './useFilteredEmployees'

function EmployeeList({ onRequestTerminateEmployee }) {
  const { denominationToken } = useAppState()
  const employees = useParsedEmployees()

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
      onRequestTerminateEmployee={onRequestTerminateEmployee}
      onRoleChange={handleRoleChange}
      onStatusChange={handleStatusChange}
      selectedRole={selectedRole}
      selectedStatus={selectedStatus}
      token={denominationToken}
    />
  )
}

export default EmployeeList
