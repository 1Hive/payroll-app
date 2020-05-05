import React from 'react'
import { Box, GU, textStyle, useTheme } from '@aragon/ui'
import { useAppState } from '@aragon/api-react'
import {
  useCurrentEmployee,
  useEmployeeCurrentOwedSalary,
} from '../../hooks/employee-hooks'
import { formatTokenAmount } from '../../utils/formatting'

const splitAmount = (amount, decimals) => {
  const [integer, fractional] = formatTokenAmount(
    amount,
    false,
    decimals
  ).split('.')
  return (
    <span>
      <span>{integer}</span>
      {fractional && (
        <span
          css={`
            ${textStyle('body1')}
          `}
        >
          .{fractional}
        </span>
      )}
    </span>
  )
}

function Salary() {
  const theme = useTheme()
  const employee = useCurrentEmployee()
  const { denominationToken } = useAppState()

  const employeeOwedSalary = useEmployeeCurrentOwedSalary(employee)

  return (
    <Box heading="Salary">
      <div
        css={`
          margin-bottom: ${2 * GU}px;
        `}
      >
        <h3
          css={`
            color: ${theme.contentSecondary};
          `}
        >
          Balance available
        </h3>
        <div
          css={`
            color: ${theme.positive};
          `}
        >
          <span
            css={`
              ${textStyle('title1')};
              font-weight: 200;
            `}
          >
            {splitAmount(employeeOwedSalary, denominationToken.decimals)}
          </span>{' '}
          {denominationToken.symbol}
        </div>
      </div>
      <div>
        <h3
          css={`
            color: ${theme.contentSecondary};
          `}
        >
          Monthly rate
        </h3>
        <div>
          <span>???</span>
        </div>
      </div>
    </Box>
  )
}

export default Salary