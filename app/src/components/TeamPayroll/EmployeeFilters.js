import React from 'react'
import { DropDown, GU } from '@aragon/ui'

const EmployeeFilters = ({
  roles,
  roleFilter,
  onRoleChange,
  status,
  statusFilter,
  onStatusChange,
}) => {
  return (
    <div
      css={`
        margin-top: ${3 * GU}px;
        display: inline-grid;
        grid-gap: ${1.5 * GU}px;
        grid-template-columns: auto auto auto;
      `}
    >
      <DropDown
        placeholder="Role (All)"
        header="Role"
        items={roles}
        selected={roleFilter}
        onChange={onRoleChange}
        width="140px"
      />
      <DropDown
        placeholder="Status (All)"
        header="Status"
        items={status}
        selected={statusFilter}
        onChange={onStatusChange}
        width="140px"
      />
    </div>
  )
}

export default EmployeeFilters
