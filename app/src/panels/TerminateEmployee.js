import React, { useCallback, useMemo, useState } from 'react'
import { useAppState } from '@aragon/api-react'
import {
  Button,
  Field,
  GU,
  IdentityBadge,
  Info,
  shortenAddress,
} from '@aragon/ui'
import SingleDatePicker from '../components/SingleDatePicker/SingleDatePicker'
import { dayjs } from '../utils/date-utils'

const DATE_INVALID_FORMAT = Symbol('DATE_INVALID_FORMAT')

const TerminateEmployee = React.memo(function TerminateEmployee({
  employeeId,
  onAction: onTerminateEmployee,
}) {
  const [endDate, setEndDate] = useState(null)
  const [error, setError] = useState(null)

  const { employees = [] } = useAppState()

  const employeeAddress = useMemo(
    () =>
      employees.find(employee => employee.id === employeeId)?.accountAddress,
    [employees, employeeId]
  )

  const validate = useCallback(() => {
    if (!dayjs(endDate).isValid()) {
      return DATE_INVALID_FORMAT
    }

    return null
  }, [endDate])

  const handleEndDateChange = useCallback(endDate => {
    setError(null)
    setEndDate(endDate)
  }, [])

  const handleFormSubmit = useCallback(
    event => {
      event.preventDefault()

      const error = validate()
      if (error) {
        return setError(error)
      }

      const endDateInSeconds = dayjs(endDate)
        .endOf('day')
        .unix()
      onTerminateEmployee(employeeId, endDateInSeconds)
    },
    [employeeId, endDate, onTerminateEmployee, validate]
  )

  return (
    <form onSubmit={handleFormSubmit}>
      <Info
        title="Action"
        css={`
          margin: ${3 * GU}px 0;
        `}
      >
        <div>
          Terminate employee with address {shortenAddress(employeeAddress)}
        </div>
        <strong>
          Owed salary will accrue until the end of day of selected date
        </strong>
      </Info>
      <div
        css={`
          display: flex;
          align-items: center;
          justify-content: space-between;
        `}
      >
        <Field label="Employee">
          <div
            css={`
              margin: ${1 * GU}px 0;
            `}
          >
            <IdentityBadge entity={employeeAddress} />
          </div>
        </Field>
        <Field label="End date" wide>
          <SingleDatePicker
            format="iso"
            initialDate={endDate}
            onChange={handleEndDateChange}
            validFromToday
          />
        </Field>
      </div>
      <Button label="Terminate" type="submit" mode="strong" wide />

      {error && (
        <Info
          css={`
            margin-top: ${2 * GU}px;
          `}
          mode="error"
        >
          End date is not a valid date
        </Info>
      )}
    </form>
  )
})

export default TerminateEmployee
