const { hash } = require('eth-ens-namehash')
const deployDAO = require('./helpers/deployDAO')
const BN = require('bn.js')

const TokenManager = artifacts.require('TokenManager.sol')
const MiniMeToken = artifacts.require('MiniMeToken.sol')

const ANY_ADDRESS = '0xffffffffffffffffffffffffffffffffffffffff'
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

const bn = x => new web3.BigNumber(x)
const bigExp = (number, decimals) => bn(number).mul(bn(10).pow(bn(decimals)))

const getLog = (receipt, logName, argName) => {
  const log = receipt.logs.find(({ event }) => event === logName)
  return log ? log.args[argName] : null
}

const deployedContract = receipt => getLog(receipt, 'NewAppProxy', 'proxy')

contract('TokenManager', ([appManager, user]) => {
  let ASSIGN_ROLE, MINT_ROLE
  let tokenManagerBase, tokenManager, token

  before('deploy base tokenManager', async () => {
    tokenManagerBase = await TokenManager.new()
    ASSIGN_ROLE = await tokenManagerBase.ASSIGN_ROLE()
    MINT_ROLE = await tokenManagerBase.MINT_ROLE()
  })

  beforeEach('deploy dao and tokenManager', async () => {
    const { dao, acl } = await deployDAO(appManager)

    const newAppInstanceReceipt = await dao.newAppInstance(hash('abc'), tokenManagerBase.address, '0x', false, { from: appManager })
    tokenManager = await TokenManager.at(deployedContract(newAppInstanceReceipt))
    await acl.createPermission(ANY_ADDRESS, tokenManager.address, ASSIGN_ROLE, appManager, { from: appManager })
    await acl.createPermission(ANY_ADDRESS, tokenManager.address, MINT_ROLE, appManager, { from: appManager })

    token = await MiniMeToken.new(ZERO_ADDRESS, ZERO_ADDRESS, 0, "Token", 18, "TKN", true)
    await token.changeController(tokenManager.address)

    await tokenManager.initialize(token.address, true, bigExp(10000000000, 18))
    await tokenManager.mint(appManager, bigExp(1000000, 18))
    await token.transfer(tokenManager.address, 10000)
  })

  it('gas usage of transfer() less than 143k', async () => {
    const transferReceipt = await token.transfer(user, bigExp(1, 18))
    const gasUsed = transferReceipt.receipt.gasUsed
    console.log(`Gas used: ${gasUsed}`)
    assert.isBelow(gasUsed, 143000)
  })

  it('gas usage of transfer() with 1 vestings less than 145k', async () => {
    await tokenManager.assignVested(appManager, 1, 10, 10, 10, true);

    const transferReceipt = await token.transfer(user, bigExp(1, 18))
    const gasUsed = transferReceipt.receipt.gasUsed
    console.log(`Gas used: ${transferReceipt.receipt.gasUsed}`)

    assert.isBelow(gasUsed, 145000)
  })

  it('gas usage of transfer() with 10 vestings less than 164k', async () => {
    for (let i = 0; i < 10; i++) {
      await tokenManager.assignVested(appManager, 1, 10, 10, 10, true);
    }

    const transferReceipt = await token.transfer(user, bigExp(1, 18))
    const gasUsed = transferReceipt.receipt.gasUsed
    console.log(`Gas used: ${transferReceipt.receipt.gasUsed}`)

    assert.isBelow(gasUsed, 164000)
  })

  it('gas usage of transfer() with 50 vestings less than 250k', async () => {
    for (let i = 0; i < 50; i++) {
      if (i % 10 === 0) console.log(`Vestings made: ${i}`)
      await tokenManager.assignVested(appManager, 1, 10, 10, 10, true);
    }

    const transferReceipt = await token.transfer(user, bigExp(1, 18))
    const gasUsed = transferReceipt.receipt.gasUsed
    console.log(`Gas used: ${transferReceipt.receipt.gasUsed}`)

    assert.isBelow(gasUsed, 250000)
  })
})
