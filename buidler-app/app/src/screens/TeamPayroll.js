import React from 'react'

import { Split } from '@aragon/ui'
import EmployeeList from './components/TeamPayroll/EmployeeList'
// import KeyStats from './components/KeyStats'
import TotalPayroll from './components/TeamPayroll/TotalPayroll'

const TeamPayroll = () => (
  <Split
    primary={
      <>
        <TotalPayroll />
        <EmployeeList />
      </>
    }
    secondary={<>{/* <KeyStats /> */}</>}
  />
)

export default TeamPayroll
