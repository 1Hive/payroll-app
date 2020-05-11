import React from 'react'
import styled from 'styled-components'
import { CardLayout, GU, textStyle, useTheme } from '@aragon/ui'
import { usePayrollStats } from '../../hooks/payroll-hooks'

import userGroupSvg from '../../assets/user-group.svg'
import chartSvg from '../../assets/chart.svg'
import coinSvg from '../../assets/coin.svg'
import coinsSvg from '../../assets/coins.svg'
import coinClockSvg from '../../assets/coin-clock.svg'
import { formatTokenAmount } from '../../utils/formatting'

const statsMetadata = [
  { label: 'Employees', icon: userGroupSvg },
  { label: 'Avarage salary', icon: chartSvg },
  { label: 'Monthly Liability', icon: coinSvg },
  { label: 'Total paid this year', icon: coinsSvg },
  { label: 'Issuance', icon: coinClockSvg },
]

function KeyStats() {
  const theme = useTheme()
  const stats = usePayrollStats()

  return (
    <div>
      <CardLayout
        columnWidthMin={25 * GU}
        rowHeight={170}
        css={`
          padding-bottom: ${2 * GU}px;
        `}
      >
        {Object.values(stats).map(({ value, token }, index) => {
          const metadata = statsMetadata[index]
          const stat = token
            ? formatTokenAmount(value, false, token.decimals)
            : value

          return (
            <Card key={index} background={theme.surface}>
              <div
                css={`
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: space-between;
                  height: 100%;
                `}
              >
                <img src={metadata.icon} alt="" width={50} height={50} />
                <div
                  css={`
                    ${textStyle('title2')};
                    font-weight: 200;
                  `}
                >
                  {stat}
                </div>
                <div
                  css={`
                    color: ${theme.contentSecondary};
                    text-align: center;
                  `}
                >
                  {metadata.label}{' '}
                  {token?.symbol && <span>({token.symbol})</span>}
                </div>
              </div>
            </Card>
          )
        })}
      </CardLayout>
    </div>
  )
}

const Card = styled.div`
  border: 0;
  border-radius: 4px;
  height: 100%;
  padding: ${3 * GU}px ${2 * GU}px;
  box-shadow: rgba(51, 77, 117, 0.2) 0px 1px 3px;
  background: ${({ background }) => background};
`

export default KeyStats
