import React from 'react'

import { Split } from '@aragon/ui'
import EmployeeList from './components/EmployeeList'
import KeyStats from './components/KeyStats'
import TotalPayroll from './components/TotalPayroll'

const TeamPayroll = () => (
  <Split
    primary={
      <>
        <TotalPayroll />
        <EmployeeList />
      </>
    }
    secondary={
      <>
        <KeyStats />
      </>
    }
  />
)

export default TeamPayroll
