const { annualSalaryPerSecond, ONE } = require('../helpers/numbers')(web3)
const { NOW, ONE_MONTH } = require('../helpers/time')
const { deployContracts, createPayroll } = require('../helpers/deploy')(artifacts, web3)
const { deployDAI } = require('../helpers/tokens')(artifacts, web3)

contract('Payroll gas costs', ([owner, employee, anotherEmployee]) => {
  let dao, payroll, payrollBase, finance, vault, DAI, equityTokenManager

  before('deploy base apps and tokens', async () => {
    ({ dao, finance, vault, payrollBase, equityTokenManager } = await deployContracts(owner))
    DAI = await deployDAI(owner, finance)
  })

  beforeEach('create payroll and price feed instance', async () => {
    payroll = await createPayroll(dao, payrollBase, owner, NOW)
  })

  describe('gas costs', () => {
    beforeEach('initialize payroll app using DAI as denomination token', async () => {
      await payroll.initialize(finance.address, DAI.address, equityTokenManager.address, ONE, 0, 0, false, { from: owner })

      const startDate = NOW - ONE_MONTH
      const salary = annualSalaryPerSecond(100000)
      await payroll.addEmployee(employee, salary, startDate, 'Boss')
      await payroll.addEmployee(anotherEmployee, salary, startDate, 'Manager')
    })

    context('when there is only one allowed token', function () {
      it('expends ~360k gas when requesting all denomination token', async () => {
        await payroll.determineAllocation(ONE, { from: employee })

        const { receipt: { cumulativeGasUsed } } = await payroll.payday(0, { from: employee })

        console.log('cumulativeGasUsed:', cumulativeGasUsed)
        assert.isAtMost(cumulativeGasUsed, 360000, 'payout gas cost for a single allowed token should be ~338k')
      })

      it('expends ~200k gas when requesting all equity', async () => {
        await payroll.determineAllocation(0, { from: employee })

        const { receipt: { cumulativeGasUsed } } = await payroll.payday(0, { from: employee })

        console.log('cumulativeGasUsed:', cumulativeGasUsed)
        assert.isAtMost(cumulativeGasUsed, 200000, 'payout gas cost for a single allowed token should be ~338k')
      })
    })
  })
})
