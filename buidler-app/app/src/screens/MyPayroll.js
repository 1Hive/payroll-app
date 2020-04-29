import React from 'react'

import { Split } from '@aragon/ui'
import SalaryAllocation from './components/SalaryAllocation'
import PreviousSalary from './components/PreviousSalary'
import AvailableSalary from './components/AvailableSalary'

const MyPayroll = () => (
  <Split
    primary={
      <>
        <AvailableSalary />
        <PreviousSalary />
      </>
    }
    secondary={<SalaryAllocation />}
  />
)

export default MyPayroll
