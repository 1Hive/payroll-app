import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  ContextMenu,
  ContextMenuItem,
  DataView,
  GU,
  IconCircleMinus,
  IdentityBadge,
  textStyle,
  useLayout,
  useTheme,
} from '@aragon/ui'
import EmployeeFilters from './EmployeeFilters'

import { employeeType } from '../../types'
import { dateFormat } from '../../utils/date-utils'
import { formatTokenAmount } from '../../utils/formatting-utils'

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
  onRequestTerminateEmployee,
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
        yearlySalary,
      }) => {
        return [
          <IdentityBadge entity={accountAddress} />,
          <span>{dateFormat(startDate)}</span>,
          <span>{role}</span>,
          <span>{terminated ? 'Inactive' : 'Active'}</span>,
          <span>
            {formatTokenAmount(yearlySalary, true, token.decimals)}{' '}
            {token.symbol}
          </span>,
        ]
      }}
      onStatusEmptyClear={onClearFilters}
      renderEntryActions={({ id, terminated }) =>
        !terminated ? (
          <ContextMenu zIndex={1}>
            <ContextMenuTerminateEmployee
              employeeId={id}
              onTerminateEmployee={onRequestTerminateEmployee}
            />
          </ContextMenu>
        ) : null
      }
    />
  )
}

const ContextMenuTerminateEmployee = ({ employeeId, onTerminateEmployee }) => {
  const theme = useTheme()

  const handleTerminateEmployee = useCallback(() => {
    onTerminateEmployee(employeeId)
  }, [employeeId, onTerminateEmployee])

  return (
    <ContextMenuItem onClick={handleTerminateEmployee}>
      <IconCircleMinus
        css={`
          color: ${theme.negative};
        `}
      />
      <span
        css={`
          margin-left: ${1 * GU}px;
        `}
      >
        Terminate
      </span>
    </ContextMenuItem>
  )
}

EmployeeTable.propTypes = {
  filteredEmployees: PropTypes.arrayOf(employeeType).isRequired,
}

export default React.memo(EmployeeTable)
