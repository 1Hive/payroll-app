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

//   handleFormSubmit = event => {
//     event.preventDefault()
//     const { denominationToken, app, isAddressAvailable } = this.props
//     const { address, name, salary, role, startDate } = this.state
//     const _address = address.value
//     const _isValidAddress = AddEmployee.validateAddress(address)
//     const _isAddressAvailable = isAddressAvailable(_address)
//
//     if (!_isValidAddress) {
//       this.setState(({ address }) => ({
//         address: {
//           ...address,
//           error: ADDRESS_INVALID_FORMAT,
//         },
//       }))
//       return
//     }
//
//     if (!_isAddressAvailable) {
//       this.setState(({ address }) => ({
//         address: {
//           ...address,
//           error: ADDRESS_NOT_AVAILABLE_ERROR,
//         },
//       }))
//       return
//     }
//
//     const isValidForm = AddEmployee.validate(this.state)
//
//     if (app && isValidForm) {
//       const initialDenominationSalary = salary / SECONDS_IN_A_YEAR
//
//       const adjustedAmount = toDecimals(
//         initialDenominationSalary.toString(),
//         denominationToken.decimals,
//         {
//           truncate: true,
//         }
//       )
//
//       const _startDate = Math.floor(startDate.getTime() / 1000)
//
//       app
//         .addEmployee(_address, adjustedAmount, name, role, _startDate)
//         .subscribe(employee => {
//           if (employee) {
//             // Reset form data
//             this.setState(AddEmployee.initialState)
//
//             // Close side panel
//             this.props.onClose()
//           }
//         })
//     }
//   }
//

const Form = styled.form`
  margin-top: ${3 * GU}px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 20px;

  > :first-child,
  > :nth-last-child(-n + 1) {
    grid-column: span 2;
  }
`

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
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [salary, setSalary] = useState('')
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const inputRef = useSidePanelFocusOnReady()

  const handleSubmit = useCallback(
    event => {
      event.preventDefault()
      onAddEmployee(address, salary, name, role, new Date(startDate))
    },
    [onAddEmployee, address, name, role, salary, startDate]
  )

  const handleAddressChange = useCallback(event => {
    setAddress(event.target.value)
  }, [])

  const handleNameChange = useCallback(event => {
    setName(event.target.value)
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
    <div>
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

        <Field label="Name">
          <TextInput value={name} onChange={handleNameChange} required wide />
        </Field>

        <Field label="Role">
          <TextInput value={role} onChange={handleRoleChange} required wide />
        </Field>

        <Field label="Salary">
          <TextInput
            value={salary}
            onChange={handleSalaryChange}
            required
            wide
          />
        </Field>

        <Field label="Start Date">
          <TextInput
            value={startDate}
            onChange={handleStartDateChange}
            required
            wide
          />
        </Field>

        <Button type="submit" mode="strong">
          Add new employee
        </Button>
      </Form>
    </div>
  )
}

AddEmployeePanelContent.propTypes = {
  onAddEmployee: PropTypes.func,
}

AddEmployeePanelContent.defaultProps = {
  onAddEmployee: () => {},
}

export default AddEmployeePanel
