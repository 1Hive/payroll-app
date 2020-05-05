
import { useCallback, useMemo, useState } from 'react'

const UNSELECTED_ROLE_TYPE_FILTER = -1
const UNSELECTED_STATUS_TYPE_FILTER = -1

function useFilteredEmployees(employees) {
  const [selectedRole, setSelectedRole] = useState(UNSELECTED_ROLE_TYPE_FILTER)
  const [selectedStatus, setSelectedStatus] = useState(
    UNSELECTED_STATUS_TYPE_FILTER
  )

  const handleRoleChange = useCallback(index => {
    const roleTypeIndex = index === 0 ? UNSELECTED_ROLE_TYPE_FILTER : index
    setSelectedRole(roleTypeIndex)
  }, [])

  const handleStatusChange = useCallback(index => {
    const statusTypeIndex = index === 0 ? UNSELECTED_STATUS_TYPE_FILTER : index
    setSelectedStatus(statusTypeIndex)
  }, [])

  const handleClearFilters = useCallback(() => {
    setSelectedRole(UNSELECTED_ROLE_TYPE_FILTER)
    setSelectedStatus(UNSELECTED_STATUS_TYPE_FILTER)
  }, [])

  const roles = ['All', ...new Set(employees.map(e => e.role))]
  const status = ['All', 'Active', 'Inactive']

  const filteredEmployees = useMemo(
    () =>
      employees.filter(({ role, terminated }) => {
        if (selectedRole > 0 && role !== roles[selectedRole]) {
          return false
        }

        if (selectedStatus > 0) {
          return selectedStatus === 1 ? !terminated : terminated
        }

        return true
      }),
    [employees, roles]
  )

  const emptyResultsViaFilters =
    filteredEmployees.length === 0 && (selectedRole > 0 || selectedStatus > 0)

  return {
    emptyResultsViaFilters,
    filteredEmployees,
    handleClearFilters,
    handleRoleChange,
    handleStatusChange,
    filters: { roles, status },
    selectedRole,
    selectedStatus,
  }
}

export default useFilteredEmployees