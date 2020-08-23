const { deployDAI } = require('../helpers/tokens')(artifacts, web3)
const { assertRevert } = require('../helpers/assertRevert')
const { NOW } = require('../helpers/time')
const { deployContracts, createPayroll } = require('../helpers/deploy')(artifacts, web3)
const { ONE } = require('../helpers/numbers')(web3)

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

contract('Payroll initialization', ([owner]) => {
  let dao, payroll, payrollBase, finance, vault, DAI, equityTokenManager

  before('deploy base apps and tokens', async () => {
    ({ dao, finance, vault, payrollBase, equityTokenManager } = await deployContracts(owner))
    DAI = await deployDAI(owner, finance)
  })

  beforeEach('create payroll and price feed instance', async () => {
    payroll = await createPayroll(dao, payrollBase, owner, NOW)
  })

  describe('initialize', function () {

    it('cannot initialize the base app', async () => {
      await assertRevert(payrollBase.initialize(finance.address, DAI.address, equityTokenManager.address, ONE, 0, 0, false, { from: owner }), 'INIT_ALREADY_INITIALIZED')
    })

    context('when it has not been initialized yet', function () {
      it('reverts when passing an invalid finance instance', async () => {
        await assertRevert(payroll.initialize(ZERO_ADDRESS, DAI.address, equityTokenManager.address, ONE, 0, 0, false, { from: owner }), 'PAYROLL_FINANCE_NOT_CONTRACT')
      })

      it('reverts when initialized with a non-contract denomination token', async () => {
        await assertRevert(payroll.initialize(finance.address, ZERO_ADDRESS, equityTokenManager.address, ONE, 0, 0, false, { from: owner }), 'PAYROLL_DENOMINATION_TOKEN_NOT_CONTRACT')
      })

      it('reverts when initialized with a non-contract token manager', async () => {
        await assertRevert(payroll.initialize(finance.address, DAI.address, ZERO_ADDRESS, ONE, 0, 0, false, { from: owner }), 'PAYROLL_TOKEN_MANAGER_NOT_CONTRACT')
      })

      it('reverts when initialized with bad vesting settings', async () => {
        await assertRevert(payroll.initialize(finance.address, DAI.address, equityTokenManager.address, ONE, 10, 11, false, { from: owner }), 'PAYROLL_CLIFF_PERIOD_TOO_HIGH')
      })
    })

    context('when it has already been initialized', function () {
      beforeEach('initialize payroll app', async () => {
        await payroll.initialize(finance.address, DAI.address, equityTokenManager.address, ONE, 0, 0, false, { from: owner })
      })

      it('cannot be initialized again', async () => {
        await assertRevert(payroll.initialize(finance.address, DAI.address, equityTokenManager.address, ONE, 0, 0, false, { from: owner }), 'INIT_ALREADY_INITIALIZED')
      })

      it('has a price feed instance, a finance instance, a denomination token and a rate expiration time', async () => {
        assert.equal(await payroll.finance(), finance.address, 'finance address should match')
        assert.equal(await payroll.denominationToken(), DAI.address, 'denomination token address does not match')
        assert.equal(await payroll.equityTokenManager(), equityTokenManager.address, 'equityTokenManager address should match')
        assert.equal((await payroll.equityMultiplier()).toString(), ONE.toString(), 'equityMultiplier does not match')
        assert.equal(await payroll.vestingLength(), 0, 'vestingLength does not match')
        assert.equal(await payroll.vestingCliffLength(), 0, 'vestingCliffLength does not match')
        assert.equal(await payroll.vestingRevokable(), false, 'vestingRevokable does not match')
      })
    })
  })
})
