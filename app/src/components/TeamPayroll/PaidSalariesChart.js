import React from 'react'
import { Box } from '@aragon/ui'
import SalaryChart from '../SalaryChart'
import { useAppState } from '@aragon/api-react'

function PaidSalariesChart() {
  const { payments } = useAppState()

  return (
    <Box heading="Paid salaries">
      <SalaryChart payments={payments} />
    </Box>
  )
}

export default PaidSalariesChart
