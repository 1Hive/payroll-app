import React from 'react'

import { Box } from '@aragon/ui'
import PaidSalaries from '../PaidSalaries'
import YearlySalarySummary from '../YearlySalarySummary'

const KeyStats = () => (
  <Box heading="Key Stats">
    <PaidSalaries />
    <YearlySalarySummary />
  </Box>
)

export default KeyStats
