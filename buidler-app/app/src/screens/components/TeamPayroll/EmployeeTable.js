import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  DataView,
  IdentityBadge,
  textStyle,
  useLayout,
  useTheme,
} from '@aragon/ui'
import EmployeeFilters from './EmployeeFilters'

import { employeeType } from '../../../types'
import { formatDate } from '../../../utils/formatting'

const columns = [
  'Employee',
  'Start Date',
  'Role',
  'Salary',
  'Total Paid This Year',
]

function EmployeeTable({
  emptyResultsViaFilters,
  employees,
  filteredEmployees,
  formatSalary,
  formatCurrency,
  filters,
  onClearFilters,
  onRoleChange,
  onStatusChange,
  selectedRole,
  selectedStatus,
}) {
  const theme = useTheme()
  const { layoutName } = useLayout()
  const compactMode = layoutName === 'small'

  const dataViewStatus = useMemo(() => {
    if (emptyResultsViaFilters && employees.length > 0) {
      return 'empty-filters'
    }

    return 'default'
  }, [emptyResultsViaFilters, employees])

  return (
    <DataView
      heading={
        <>
          <div
            css={`
              color: ${theme.content};
              ${textStyle('body1')};
            `}
          >
            Employees
          </div>
          {!compactMode && (
            <EmployeeFilters
              roles={filters.roles}
              roleFilter={selectedRole}
              onRoleChange={onRoleChange}
              status={filters.status}
              statusFilter={selectedStatus}
              onStatusChange={onStatusChange}
            />
          )}
        </>
      }
      status={dataViewStatus}
      statusEmpty={
        <p
          css={`
            ${textStyle('title2')};
          `}
        >
          No employees yet.
        </p>
      }
      fields={columns}
      entries={filteredEmployees}
      renderEntry={({ accountAddress, startDate, role, salary, totalPaid }) => [
        <IdentityBadge entity={accountAddress} />,
        <span>{formatDate(startDate)}</span>,
        <span>{role}</span>,
        <span>{formatSalary(salary)}</span>,
        <span>{formatCurrency(totalPaid)}</span>,
      ]}
      onStatusEmptyClear={onClearFilters}
    />
  )
}

EmployeeTable.propTypes = {
  filteredEmployees: PropTypes.arrayOf(employeeType).isRequired,
  formatCurrency: PropTypes.func,
}

export default EmployeeTable
