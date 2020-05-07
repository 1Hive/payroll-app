const { deployDAI } = require('../helpers/tokens')(artifacts, web3)
const { assertRevert } = require('../helpers/assertRevert')
const { NOW } = require('../helpers/time')
const { deployContracts, createPayroll } = require('../helpers/deploy')(artifacts, web3)
const { ONE, bn } = require('../helpers/numbers')(web3)

contract('Payroll settings', ([owner, nonContractAddress]) => {
  let dao, payroll, payrollBase, finance, vault, equityTokenManager, DAI, contract

  before('deploy base apps and tokens', async () => {
    ({ dao, finance, vault, payrollBase, equityTokenManager } = await deployContracts(owner))
    DAI = await deployDAI(owner, finance)
    contract = DAI
  })

  beforeEach('create payroll', async () => {
    payroll = await createPayroll(dao, payrollBase, owner, NOW)
    await payroll.initialize(finance.address, DAI.address, equityTokenManager.address, ONE, 0, 0, false, { from: owner })
  })

  describe('setFinance', () => {

    it('sets correctly', async () => {
      await payroll.setFinance(contract.address)
      const newFinance = await payroll.finance()
      assert.equal(newFinance, contract.address)
    })

    it('reverts when not contract', async () => {
      await assertRevert(payroll.setFinance(nonContractAddress), "PAYROLL_FINANCE_NOT_CONTRACT")
    })
  })

  describe('setDenominationToken', () => {

    it('sets correctly', async () => {
      const DAINew = await deployDAI(owner, finance)
      await payroll.setDenominationToken(DAINew.address)
      const newDenominationToken = await payroll.denominationToken()
      assert.equal(newDenominationToken, DAINew.address)
    })

    it('reverts when not contract', async () => {
      await assertRevert(payroll.setDenominationToken(nonContractAddress), "PAYROLL_DENOMINATION_TOKEN_NOT_CONTRACT")
    })
  })

  describe('setEquityTokenManager', () => {

    it('sets correctly', async () => {
      await payroll.setEquityTokenManager(contract.address)
      const newEquityTokenManager = await payroll.equityTokenManager()
      assert.equal(newEquityTokenManager, contract.address)
    })

    it('reverts when not contract', async () => {
      await assertRevert(payroll.setEquityTokenManager(nonContractAddress), "PAYROLL_TOKEN_MANAGER_NOT_CONTRACT")
    })
  })

  describe('setEquitySettings', () => {

    it('sets correctly', async () => {
      const expectedEquityMultiplier = bn(2000)
      const expectedVestingLength = 1000
      const expectedVestingCliff = 10
      const expectedVestingRevokable = true

      await payroll.setEquitySettings(expectedEquityMultiplier, expectedVestingLength, expectedVestingCliff, expectedVestingRevokable)

      const newEquityMultiplier = await payroll.equityMultiplier()
      const vestingLength = await payroll.vestingLength()
      const vestingCliffLength = await payroll.vestingCliffLength()
      const vestingRevokable = await payroll.vestingRevokable()

      assert.equal(newEquityMultiplier.toString(), expectedEquityMultiplier.toString())
      assert.equal(vestingLength, expectedVestingLength)
      assert.equal(vestingCliffLength, expectedVestingCliff)
      assert.equal(vestingRevokable, expectedVestingRevokable)
    })

    it('reverts when cliff is greater than length', async () => {
      await assertRevert(payroll.setEquitySettings(ONE, 100, 101, false), 'PAYROLL_CLIFF_PERIOD_TOO_HIGH')
    })
  })

})
