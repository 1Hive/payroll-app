import React, { useCallback, useMemo, useState } from 'react'
import styled from 'styled-components'
import BN from 'bn.js'
import { useAppState } from '@aragon/api-react'
import {
  Button,
  Field,
  GU,
  Info,
  TextInput,
  useSidePanelFocusOnReady,
  useTheme,
} from '@aragon/ui'
import SingleDatePicker from '../components/SingleDatePicker/SingleDatePicker'

import { dayjs } from '../utils/date-utils'
import { toDecimals } from '../utils/math-utils'
import { SECONDS_IN_A_YEAR } from '../utils/calculations-utils'
import { addressesEqual, isAddress } from '../utils/web3-utils'

const ADDRESS_NOT_AVAILABLE_ERROR = Symbol('ADDRESS_NOT_AVAILABLE_ERROR')
const ADDRESS_INVALID_FORMAT = Symbol('ADDRESS_INVALID_FORMAT')
const DATE_INVALID_FORMAT = Symbol('DATE_INVALID_FORMAT')

const AddEmployee = React.memo(function AddEmployee({
  onAction: onAddEmployee,
}) {
  const { denominationToken, employees } = useAppState()

  const isEmployeeAddressAvailable = useCallback(
    address =>
      !employees ||
      employees.every(
        employee => !addressesEqual(employee.accountAddress, address)
      ),
    [employees]
  )

  const [address, setAddress] = useState('')
  const [role, setRole] = useState('')
  const [salary, setSalary] = useState('')
  const [startDate, setStartDate] = useState(null)
  const [error, setError] = useState(null)

  const theme = useTheme()
  const inputRef = useSidePanelFocusOnReady()

  const validate = useCallback(() => {
    if (!isAddress(address)) {
      return ADDRESS_INVALID_FORMAT
    }

    if (!isEmployeeAddressAvailable(address)) {
      return ADDRESS_NOT_AVAILABLE_ERROR
    }

    if (!dayjs(startDate).isValid()) {
      return DATE_INVALID_FORMAT
    }

    return null
  }, [address, isEmployeeAddressAvailable, startDate])

  const handleAddressChange = useCallback(event => {
    setError(null)
    setAddress(event.target.value)
  }, [])

  const handleRoleChange = useCallback(event => {
    setError(null)
    setRole(event.target.value)
  }, [])

  const handleSalaryChange = useCallback(event => {
    setError(null)
    setSalary(event.target.value)
  }, [])

  const handleStartDateChange = useCallback(startDate => {
    setError(null)
    setStartDate(startDate)
  }, [])

  const handleSubmit = useCallback(
    event => {
      event.preventDefault()

      const error = validate()
      if (error) {
        return setError(error)
      }

      // Adding one second since it takes 00:00hs as the previous day
      const startDateInSeconds = dayjs(startDate)
        .add(1, 'second')
        .unix()
      const salaryDecimals = toDecimals(salary, denominationToken.decimals)
      const salaryPerSecond = new BN(salaryDecimals)
        .div(SECONDS_IN_A_YEAR)
        .toString()

      onAddEmployee(address, salaryPerSecond, startDateInSeconds, role)
    },
    [
      address,
      denominationToken.decimals,
      onAddEmployee,
      role,
      salary,
      startDate,
      validate,
    ]
  )

  const errorMsg = useMemo(() => {
    if (error === ADDRESS_INVALID_FORMAT) {
      return 'Address must be a valid ethereum address'
    }

    if (error === ADDRESS_NOT_AVAILABLE_ERROR) {
      return 'Address is already in use by another employee'
    }

    if (error === DATE_INVALID_FORMAT) {
      return 'Start date is not a valid date'
    }

    return ''
  }, [error])

  return (
    <form onSubmit={handleSubmit}>
      <Fields>
        <Field label="Address">
          <TextInput
            ref={inputRef}
            value={address.value}
            onChange={handleAddressChange}
            required
            wide
          />
        </Field>

        <Field label="Yearly Salary">
          <TextInput
            value={salary}
            onChange={handleSalaryChange}
            required
            wide
            type="number"
            adornment={
              <span
                css={`
                  background: ${theme.background};
                  border-left: 1px solid ${theme.border};
                  padding: 7px ${1.5 * GU}px;
                `}
              >
                {denominationToken.symbol}
              </span>
            }
            adornmentPosition="end"
            adornmentSettings={{ padding: 1 }}
          />
        </Field>
        <Field label="Start Date">
          <SingleDatePicker
            format="iso"
            initialDate={startDate}
            onChange={handleStartDateChange}
          />
        </Field>

        <Field label="Role">
          <TextInput value={role} onChange={handleRoleChange} required wide />
        </Field>
      </Fields>
      <Button label="Add new employee" type="submit" mode="strong" wide />

      {errorMsg && (
        <Info
          css={`
            margin-top: ${2 * GU}px;
          `}
          mode="error"
        >
          {errorMsg}
        </Info>
      )}
    </form>
  )
})

const Fields = styled.div`
  margin-top: ${3 * GU}px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 20px;
  & > :first-child,
  > :last-child {
    grid-column: span 2;
  }
`

export default AddEmployee
