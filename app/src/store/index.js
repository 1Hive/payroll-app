import { events } from '@aragon/api'
import app from './app'
import { sum } from './utils'
import { date, payment } from './marshalling'
import { addressesEqual } from '../utils/web3-utils'
import { getDenominationToken, getEquityTokenManager, getToken } from './tokens'

export default function initialize(vaultAddress) {
  async function reducer(
    state,
    { event, returnValues, transactionHash, blockNumber }
  ) {
    const nextState = {
      ...state,
    }

    switch (event) {
      case events.SYNC_STATUS_SYNCING:
        return { ...nextState, isSyncing: true }
      case events.SYNC_STATUS_SYNCED:
        return { ...nextState, isSyncing: false }
      case 'AddEmployee':
        return onAddNewEmployee(nextState, returnValues)
      case 'ChangeAddressByEmployee':
        return onChangeEmployeeAddress(nextState, returnValues)
      case 'EditEquitySettings':
        return onEditEquitySettings(nextState, returnValues)
      case 'Payday':
        return onPayday(nextState, returnValues, transactionHash, blockNumber)
      case 'SetEmployeeSalary':
        return onSetEmployeeSalary(nextState, returnValues, blockNumber)
      case 'AddEmployeeAccruedSalary':
        return onAddEmployeeAccruedSalary(nextState, returnValues)
      case 'TerminateEmployee':
        return onTerminateEmployee(nextState, returnValues)
      default:
        return nextState
    }
  }

  const storeOptions = {
    init: initState({ vaultAddress }),
  }
  return app.store(reducer, storeOptions)
}

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

function initState({ vaultAddress }) {
  return async cachedState => {
    try {
      const [
        denominationToken,
        equityTokenManager,
        pctBase,
        equityMultiplier,
        vestingLength,
        vestingCliffLength,
      ] = await Promise.all([
        getDenominationToken(),
        getEquityTokenManager(),
        app.call('PCT_BASE').toPromise(),
        app.call('equityMultiplier').toPromise(),
        app.call('vestingLength').toPromise(),
        app.call('vestingCliffLength').toPromise(),
      ])

      const initialState = {
        ...cachedState,
        denominationToken,
        equityMultiplier,
        equityTokenManager,
        pctBase,
        vaultAddress,
        vestingLength,
        vestingCliffLength,
      }
      return initialState
    } catch (e) {
      console.error(e)
    }
  }
}

// Add new employee
async function onAddNewEmployee(state, { employeeId, ...employeeData }) {
  const { employees = [] } = state

  if (!employees.find(e => e.id === employeeId)) {
    const newEmployee = {
      ...employeeData,
      id: employeeId,
    }

    if (newEmployee) {
      employees.push({
        ...newEmployee,
        salary: newEmployee.initialDenominationSalary,
        startDate: date(newEmployee.startDate),
        lastPayroll: date(newEmployee.startDate),
        accruedSalary: '0',
      })
    }
  }

  return { ...state, employees }
}

// Change employee address
async function onChangeEmployeeAddress(
  state,
  { newAccountAddress, oldAccountAddress }
) {
  const { employees = [] } = state

  const employee = employees.find(employee =>
    addressesEqual(employee.accountAddress, oldAccountAddress)
  )

  return {
    ...state,
    employee: { ...employee, accountAddress: newAccountAddress },
  }
}

async function onEditEquitySettings(
  state,
  { equityMultiplier, vestingLength, vestingCliffLength }
) {
  return { ...state, equityMultiplier, vestingLength, vestingCliffLength }
}

async function onPayday(state, returnValues, transactionHash, blockNumber) {
  const { employeeId, token } = returnValues
  const { denominationToken, employees, payments = [] } = state
  const { timestamp } = await app.web3Eth('getBlock', blockNumber).toPromise()

  const employee = getEmployeeById(employees, employeeId)
  const updatedEmployees = await updateEmployeeById(state, {
    employeeId,
    accruedSalary: '0',
    lastPayroll: employee.endDate || date(timestamp),
  })

  const newPayment = payment({
    ...returnValues,
    transactionHash,
    paymentDate: timestamp,
    token: addressesEqual(token, denominationToken.address)
      ? denominationToken
      : getToken(token),
  })
  payments.push(newPayment)

  return { ...state, employees: updatedEmployees, payments }
}

// Change employee's salary
async function onSetEmployeeSalary(
  state,
  { employeeId, denominationSalary },
  blockNumber
) {
  const { timestamp } = await app.web3Eth('getBlock', blockNumber).toPromise()

  const employees = await updateEmployeeById(state, {
    employeeId,
    salary: denominationSalary,
    lastPayroll: date(timestamp),
  })
  return { ...state, employees }
}

// Add accrued salary to employee (this event fires when changing employee's salary)
async function onAddEmployeeAccruedSalary(state, { employeeId, amount }) {
  const employee = await getEmployeeById(state.employees, employeeId)

  const newAccruedSalary = sum(employee.accruedSalary, amount)
  const employees = await updateEmployeeById(state, {
    employeeId,
    accruedSalary: newAccruedSalary,
  })
  return { ...state, employees }
}

// Terminate employee (set endDate)
async function onTerminateEmployee(state, { employeeId, endDate }) {
  const employees = await updateEmployeeById(state, {
    employeeId,
    endDate: date(endDate),
  })
  return { ...state, employees }
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

async function updateEmployeeById(state, { employeeId, ...newEmployeeData }) {
  const { employees } = state
  const employeeData = await getEmployeeById(employees, employeeId)

  const byId = employee => employee.id === employeeId
  const updatedEmployeeData = { ...employeeData, ...newEmployeeData }
  return updateEmployeeBy(employees, updatedEmployeeData, byId)
}

function updateEmployeeBy(employees, employeeData, by) {
  let nextEmployees = [...employees]
  const employeeIndex = nextEmployees.findIndex(by)

  if (employeeIndex < 0) {
    nextEmployees.push(employeeData)
  } else {
    nextEmployees = [
      ...nextEmployees.slice(0, employeeIndex),
      employeeData,
      ...nextEmployees.slice(employeeIndex + 1),
    ]
  }

  return nextEmployees
}

function getEmployeeById(employees, employeeId) {
  return employees.find(employee => employee.id === employeeId)
}
