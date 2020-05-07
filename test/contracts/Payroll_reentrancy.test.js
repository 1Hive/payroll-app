const { assertRevert } = require('../helpers/assertRevert')
const { bigExp, annualSalaryPerSecond, ONE } = require('../helpers/numbers')(web3)
const { NOW, ONE_MONTH } = require('../helpers/time')
const { deployContracts, createPayroll } = require('../helpers/deploy')(artifacts, web3)

const MaliciousERC20 = artifacts.require('MaliciousERC20')
const MaliciousEmployee = artifacts.require('MaliciousEmployee')

contract('Payroll reentrancy guards', ([owner]) => {
  let dao, payroll, payrollBase, finance, vault, maliciousToken, employee, equityTokenManager

  const REENTRANCY_ACTIONS = { PAYDAY: 0, CHANGE_ADDRESS: 1, SET_ALLOCATION: 2 }

  const increaseTime = async seconds => {
    await payroll.mockIncreaseTime(seconds)
  }
 
  before('deploy base apps', async () => {
    ({ dao, finance, vault, payrollBase, equityTokenManager } = await deployContracts(owner))
  })

  beforeEach(async () => {
    employee = await MaliciousEmployee.new()

    const amount = bigExp(10000, 18)
    maliciousToken = await MaliciousERC20.new(employee.address, amount, { from: owner })
    await maliciousToken.approve(finance.address, amount, { from: owner })
    await finance.deposit(maliciousToken.address, amount, 'Initial deployment', { from: owner })

    payroll = await createPayroll(dao, payrollBase, owner, NOW)
    await payroll.initialize(finance.address, maliciousToken.address, equityTokenManager.address, 1, 0, 0, false, { from: owner })
  })

  describe('reentrancy guards', () => {

    beforeEach('add malicious employee, set tokens allocations, and accrue some salary', async () => {
      await employee.setPayroll(payroll.address)
      await payroll.addEmployee(employee.address, annualSalaryPerSecond(100000), await payroll.getTimestampPublic(), 'Malicious Boss', { from: owner })
      await increaseTime(ONE_MONTH)
    })

    describe('changeAddressByEmployee', function () {
      beforeEach('set reentrancy action', async () => {
        await employee.setAction(REENTRANCY_ACTIONS.CHANGE_ADDRESS)
      })

      it('reverts', async () => {
        // If reentered directly the error would be REENTRANCY_REENTRANT_CALL. However, the error message received
        // is that which occurs the highest in the call stack, which in this case is in a call from the Vault.
        await assertRevert(employee.payday(), 'VAULT_TOKEN_TRANSFER_REVERTED')
      })
    })

    describe('payday', function () {
      beforeEach('set reentrancy action', async () => {
        await employee.setAction(REENTRANCY_ACTIONS.PAYDAY)
      })

      it('reverts', async () => {
        // If reentered directly the error would be REENTRANCY_REENTRANT_CALL. However, the error message received
        // is that which occurs the highest in the call stack, which in this case is in a call from the Vault.
        await assertRevert(employee.payday(), 'VAULT_TOKEN_TRANSFER_REVERTED')
      })
    })
  })
})
