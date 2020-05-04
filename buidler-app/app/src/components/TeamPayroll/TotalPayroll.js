// import React, { useState, useEffect } from 'react'
// import TotalPayrollTable from './TotalPayrollTable'

// import { useAragonApi } from '@aragon/api-react'
// import { Box } from '@aragon/ui'
// import {
//   totalPaidThisYear,
//   summation,
//   MONTHS_IN_A_YEAR,
// } from '../../../utils/calculations'
// import { formatTokenAmount } from '../../../utils/formatting'
// import { SECONDS_IN_A_YEAR } from '../../../utils/date-utils'

// function TotalPayroll() {
//   const {
//     employeesQty = 0,
//     averageSalary = 0,
//     monthlyBurnRate = 0,
//     totalPaidThisYear = 0,
//     denominationToken = {},
//     connectedAccount,
//   } = useTotalPayrollData()
//   const [data, setData] = useState([])

//   useEffect(() => {
//     setData([
//       { employeesQty, averageSalary, monthlyBurnRate, totalPaidThisYear },
//     ])
//   }, [connectedAccount, employeesQty])

//   const formatSalary = amount =>
//     formatTokenAmount(amount, denominationToken.decimals, {
//       multiplier: SECONDS_IN_A_YEAR,
//     })
//   const customFormatCurrency = amount =>
//     formatTokenAmount(amount, denominationToken.decimals)
//   return (
//     <Box heading="Total Payroll">
//       <TotalPayrollTable
//         data={data}
//         formatSalary={formatSalary}
//         formatCurrency={customFormatCurrency}
//       />
//     </Box>
//   )
// }

// export default TotalPayroll
