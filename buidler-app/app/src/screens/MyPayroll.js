import React from 'react'

import { Split } from '@aragon/ui'
import SalaryAllocation from './components/MyPayroll/SalaryAllocation'
import PreviousSalary from './components/MyPayroll/PreviousSalary'
import AvailableSalary from './components/MyPayroll/AvailableSalary'

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
