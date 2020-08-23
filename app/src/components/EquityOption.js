import React from 'react'
import { Box, Button, GU, IconEdit, textStyle, useTheme } from '@aragon/ui'
import { useAppState } from '@aragon/api-react'
import { multiplierFromBase } from '../utils/calculations-utils'

import { durationTime } from '../utils/date-utils'

function EquityOption({ readOnly = true, onRequestEditEquityOption }) {
  const theme = useTheme()
  const {
    equityMultiplier,
    pctBase,
    vestingLength,
    vestingCliffLength,
  } = useAppState()

  const convertedMultiplier = multiplierFromBase(equityMultiplier, pctBase)

  return (
    <div>
      <Box heading="Equity option" css="height: 100%;">
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
            Multiplier
          </h3>
          <div>
            <span
              css={`
                ${textStyle('title2')}
              `}
            >
              {convertedMultiplier}
            </span>{' '}
            X
          </div>
        </div>
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
            Vesting period
          </h3>
          <div>
            {vestingLength > 0 ? durationTime(vestingLength) : `No vesting`}
          </div>
        </div>
        <div>
          <h3
            css={`
              color: ${theme.contentSecondary};
            `}
          >
            Vesting cliff
          </h3>
          <div>
            {vestingCliffLength > 0
              ? durationTime(vestingCliffLength)
              : `No vesting`}
          </div>
        </div>
        {!readOnly && (
          <Button
            css={`
              margin-top: ${2 * GU}px;
            `}
            icon={<IconEdit />}
            label="Edit Equity Option"
            onClick={onRequestEditEquityOption}
            display="all"
            wide
          />
        )}
      </Box>
    </div>
  )
}

export default EquityOption
