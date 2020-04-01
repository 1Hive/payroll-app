const PAYMENT_TYPES = require('../helpers/payment_types')
const { annualSalaryPerSecond, ONE } = require('../helpers/numbers')(web3)
const { NOW, ONE_MONTH } = require('../helpers/time')
const { deployContracts, createPayroll } = require('../helpers/deploy')(artifacts, web3)
const { deployDAI, deployANT } = require('../helpers/tokens')(artifacts, web3)

contract('Payroll gas costs', ([owner, employee, anotherEmployee]) => {
  let dao, payroll, payrollBase, finance, vault, DAI, ANT, equityTokenManager

  before('deploy base apps and tokens', async () => {
    ({ dao, finance, vault, payrollBase, equityTokenManager } = await deployContracts(owner))
    DAI = await deployDAI(owner, finance)
    ANT = await deployANT(owner, finance)
  })

  beforeEach('create payroll and price feed instance', async () => {
    payroll = await createPayroll(dao, payrollBase, owner, NOW)
  })

  describe('gas costs', () => {
    beforeEach('initialize payroll app using DAI as denomination token', async () => {
      await payroll.initialize(finance.address, DAI.address, equityTokenManager.address, 1, 0, 0, false, { from: owner })

      const startDate = NOW - ONE_MONTH
      const salary = annualSalaryPerSecond(100000)
      await payroll.addEmployee(employee, salary, startDate, 'Boss')
      await payroll.addEmployee(anotherEmployee, salary, startDate, 'Manager')
    })

    context('when there is only one allowed token', function () {
      it('expends ~337k gas when requesting all denomination token', async () => {
        await payroll.determineAllocation(ONE, { from: employee })

        const { receipt: { cumulativeGasUsed } } = await payroll.payday(0, { from: employee })

        console.log('cumulativeGasUsed:', cumulativeGasUsed)
        assert.isAtMost(cumulativeGasUsed, 337000, 'payout gas cost for a single allowed token should be ~338k')
      })

      it('expends ~165k gas when requesting all equity', async () => {
        await payroll.determineAllocation(0, { from: employee })

        const { receipt: { cumulativeGasUsed } } = await payroll.payday(0, { from: employee })

        console.log('cumulativeGasUsed:', cumulativeGasUsed)
        assert.isAtMost(cumulativeGasUsed, 165000, 'payout gas cost for a single allowed token should be ~338k')
      })
    })
  })
})
