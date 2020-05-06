import React, { useMemo } from 'react'
import { Box, addressesEqual } from '@aragon/ui'
import { useAppState, useConnectedAccount } from '@aragon/api-react'
import SalaryChart from '../SalaryChart'

function MySalaryChart() {
  const { payments } = useAppState()
  const connectedAccount = useConnectedAccount()

  const employeePayments = useMemo(
    () =>
      payments.filter(({ accountAddress }) =>
        addressesEqual(accountAddress, connectedAccount)
      ),
    [connectedAccount, payments]
  )

  return (
    <Box heading="My salary">
      <SalaryChart payments={employeePayments} />
    </Box>
  )
}

export default MySalaryChart
