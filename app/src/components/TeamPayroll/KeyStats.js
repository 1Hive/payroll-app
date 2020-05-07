import React from 'react'
import styled from 'styled-components'
import { CardLayout, GU, useTheme } from '@aragon/ui'

const stats = [
  'Employees',
  'Avarage salary',
  'Monthly Payroll Liability',
  'Total paid this year',
  'Issuance',
]

function KeyStats() {
  const theme = useTheme()

  return (
    <div>
      <CardLayout columnWidthMin={25 * GU} rowHeight={170}>
        {stats.map((stat, index) => (
          <Card key={index} background={theme.surface}>
            {stat}
          </Card>
        ))}
      </CardLayout>
    </div>
  )
}

const Card = styled.div`
  border: 0;
  border-radius: 4px;
  height: 100%;
  padding: ${3 * GU}px;
  box-shadow: rgba(51, 77, 117, 0.2) 0px 1px 3px;
  background: ${({ background }) => background};
`

export default KeyStats
