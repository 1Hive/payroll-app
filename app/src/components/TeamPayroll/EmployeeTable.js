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

import { employeeType } from '../../types'
import { dateFormat, SECONDS_IN_A_YEAR } from '../../utils/date-utils'
import { formatTokenAmount } from '../../utils/formatting'

const columns = [
  'Employee',
  'Start Date',
  'Role',
  'Status',
  'Base asset salary',
]

function EmployeeTable({
  emptyResultsViaFilters,
  employees,
  filteredEmployees,
  filters,
  onClearFilters,
  onRoleChange,
  onStatusChange,
  selectedRole,
  selectedStatus,
  token,
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
      renderEntry={({
        accountAddress,
        startDate,
        role,
        terminated,
        salary,
      }) => {
        return [
          <IdentityBadge entity={accountAddress} />,
          <span>{dateFormat(startDate)}</span>,
          <span>{role}</span>,
          <span>{terminated ? 'Inactive' : 'Active'}</span>,
          <span>
            {formatTokenAmount(salary, true, token.decimals, false, {
              multiplier: SECONDS_IN_A_YEAR,
            })}{' '}
            {token.symbol}
          </span>,
        ]
      }}
      onStatusEmptyClear={onClearFilters}
    />
  )
}

EmployeeTable.propTypes = {
  filteredEmployees: PropTypes.arrayOf(employeeType).isRequired,
}

export default React.memo(EmployeeTable)
