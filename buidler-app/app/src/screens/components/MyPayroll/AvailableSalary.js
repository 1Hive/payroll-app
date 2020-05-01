import React from 'react'
import { Box } from '@aragon/ui'

const AvailableSalary = props => {
  // const { appState, connectedAccount } = useAragonApi()
  // const {
  //   employees = [],
  //   denominationToken: { symbol, decimals } = { symbol: '', decimals: 0 },
  //   payments = [],
  // } = appState

  // function getEmployee(addr) {
  //   return (
  //     employees && employees.find(employee => employee.accountAddress === addr)
  //   )
  // }

  // function sumExchanged() {
  //   const field = 'exchanged'
  //   const filter = e => e.accountAddress === connectedAccount
  //   const totalTransferred = summation(payments.filter(filter), field)
  //   return totalTransferred
  // }

  // function getAvailableBalance(employee) {
  //   const accruedTime = dayjs().diff(dayjs(employee.lastPayroll), 'seconds')

  //   const accruedSalary = accruedTime * employee.salary + employee.accruedValue
  //   return accruedSalary
  // }

  // function getAvailableSalaryData(employee, updateAll) {
  //   const availableBalance = getAvailableBalance(employee)

  //   const totalTransferred = updateAll
  //     ? sumExchanged()
  //     : data[0].totalTransferred

  //   const { lastPayroll, salary } = employee
  //   return [{ lastPayroll, salary, totalTransferred, availableBalance }]
  // }

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     const employee = getEmployee(connectedAccount)
  //     if (employee) {
  //       setData(getAvailableSalaryData(employee, false))
  //     }
  //   }, AVAILABLE_BALANCE_TICK)
  //   return () => clearInterval(interval)
  // }, [connectedAccount])

  // useEffect(() => {
  //   const employee = getEmployee(connectedAccount)
  //   if (employee) {
  //     setData(getAvailableSalaryData(employee, true))
  //   }
  // }, [connectedAccount, payments.length, employees.length])

  return (
    <Box headeing="Available Salary">
      {/* <AvailableSalaryTable
        data={data}
        formatSalary={formatSalary}
        formatCurrency={customFormatCurrency}
        formatTokenAmount={formatTokenAmount}
      /> */}
    </Box>
  )
}

export default AvailableSalary
