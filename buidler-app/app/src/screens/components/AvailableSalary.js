import React, { useState, useEffect } from 'react'
import { differenceInSeconds } from 'date-fns'
import AvailableSalaryTable from './AvailableSalaryTable'

import { formatCurrency, SECONDS_IN_A_YEAR } from '../../utils/formatting'
import { summation } from '../../utils/calculations'

import { useAragonApi } from '@aragon/api-react'
import { Box } from '@aragon/ui'

const AVAILABLE_BALANCE_TICK = 10000

const AvailableSalary = props => {
  const { appState, connectedAccount } = useAragonApi()
  const {
    employees = [],
    denominationToken: { symbol, decimals } = { symbol: '', decimals: 0 },
    payments = [],
  } = appState

  function getEmployee(addr) {
    return (
      employees && employees.find(employee => employee.accountAddress === addr)
    )
  }

  function sumExchanged() {
    const field = 'exchanged'
    const filter = e => e.accountAddress === connectedAccount
    const totalTransferred = summation(payments.filter(filter), field)
    return totalTransferred
  }

  function getAvailableBalance(employee) {
    const accruedTime = differenceInSeconds(
      new Date(),
      new Date(employee.lastPayroll)
    )

    const accruedSalary = accruedTime * employee.salary + employee.accruedValue
    return accruedSalary
  }

  function getAvailableSalaryData(employee, updateAll) {
    const availableBalance = getAvailableBalance(employee)

    const totalTransferred = updateAll
      ? sumExchanged()
      : data[0].totalTransferred

    const { lastPayroll, salary } = employee
    return [{ lastPayroll, salary, totalTransferred, availableBalance }]
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const employee = getEmployee(connectedAccount)
      if (employee) {
        setData(getAvailableSalaryData(employee, false))
      }
    }, AVAILABLE_BALANCE_TICK)
    return () => clearInterval(interval)
  }, [connectedAccount])

  useEffect(() => {
    const employee = getEmployee(connectedAccount)
    if (employee) {
      setData(getAvailableSalaryData(employee, true))
    }
  }, [connectedAccount, payments.length, employees.length])

  const [data, setData] = useState([])
  console.log(data, appState, props)
  const formatSalary = amount =>
    formatCurrency(amount, symbol, 10, decimals, SECONDS_IN_A_YEAR)
  const customFormatCurrency = amount => formatCurrency(amount, symbol, 10, 0)
  const formatTokenAmount = amount =>
    formatCurrency(amount, symbol, 10, decimals, 1, 2, true, true)
  return (
    <Box headeing="Available Salary">
      <AvailableSalaryTable
        data={data}
        formatSalary={formatSalary}
        formatCurrency={customFormatCurrency}
        formatTokenAmount={formatTokenAmount}
      />
    </Box>
  )
}

export default AvailableSalary
