import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  Field,
  GU,
  SidePanel,
  TextInput,
  useSidePanelFocusOnReady,
} from '@aragon/ui'
import styled from 'styled-components'

//   TODO: Validate addresses and add error messages:

const AddEmployeePanel = React.memo(function AddEmployeePanel({
  panelState,
  onAddEmployee,
}) {
  const handleClose = useCallback(() => {
    panelState.requestClose()
  }, [panelState])

  return (
    <SidePanel
      title="Add new employee"
      opened={panelState && panelState.visible}
      onClose={handleClose}
    >
      <AddEmployeePanelContent onAddEmployee={onAddEmployee} />
    </SidePanel>
  )
})

function AddEmployeePanelContent({ onAddEmployee }) {
  const [address, setAddress] = useState('')
  const [role, setRole] = useState('')
  const [salary, setSalary] = useState('')
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const inputRef = useSidePanelFocusOnReady()

  const handleSubmit = useCallback(
    event => {
      event.preventDefault()
      const startDateInSeconds = new Date(startDate).getTime() / 1000

      // TODO: format salary to decimals
      onAddEmployee(address, salary, startDateInSeconds, role)
    },
    [address, onAddEmployee, role, salary, startDate]
  )

  const handleAddressChange = useCallback(event => {
    setAddress(event.target.value)
  }, [])

  const handleRoleChange = useCallback(event => {
    setRole(event.target.value)
  }, [])

  const handleSalaryChange = useCallback(event => {
    setSalary(event.target.value)
  }, [])

  const handleStartDateChange = useCallback(event => {
    setStartDate(event.target.value)
  }, [])

  return (
    <Form onSubmit={handleSubmit}>
      <Field label="Address">
        <TextInput
          ref={inputRef}
          value={address.value}
          onChange={handleAddressChange}
          required
          wide
        />
      </Field>

      <Field label="Salary">
        <TextInput value={salary} onChange={handleSalaryChange} required wide />
      </Field>

      <Field label="Start Date">
        <TextInput
          value={startDate}
          onChange={handleStartDateChange}
          required
          wide
        />
      </Field>

      <Field label="Role">
        <TextInput value={role} onChange={handleRoleChange} required wide />
      </Field>

      <Button type="submit" mode="strong">
        Add new employee
      </Button>
    </Form>
  )
}

const Form = styled.form`
  margin-top: ${3 * GU}px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 20px;

  & > :first-child,
  > :nth-last-child(-n + 2) {
    grid-column: span 2;
  }
`

AddEmployeePanelContent.propTypes = {
  onAddEmployee: PropTypes.func,
}

AddEmployeePanelContent.defaultProps = {
  onAddEmployee: () => {},
}

export default AddEmployeePanel
