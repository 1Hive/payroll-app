import React from 'react'
import { Box, Button, GU, IconEdit, textStyle, useTheme } from '@aragon/ui'
import { useAppState } from '@aragon/api-react'

function EquityOption({ readOnly = true }) {
  const theme = useTheme()
  const { equityMultiplier, vestingLength, vestingCliffLength } = useAppState()

  return (
    <div>
      <Box heading="Equity option">
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
              {equityMultiplier}
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
          {/* TODO: Formatt field */}
          <div>{vestingLength}</div>
        </div>
        <div>
          <h3
            css={`
              color: ${theme.contentSecondary};
            `}
          >
            Vesting cliff
          </h3>
          {/* TODO: Formatt field */}
          <div>{vestingCliffLength}</div>
        </div>
        {!readOnly && (
          <Button
            css={`
              margin-top: ${2 * GU}px;
            `}
            icon={<IconEdit />}
            label="Ediit Equity Option"
            display="all"
            wide
          />
        )}
      </Box>
    </div>
  )
}

export default EquityOption
