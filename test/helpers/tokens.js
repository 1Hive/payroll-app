const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

module.exports = (artifacts, web3) => {
  const { ONE, bn, bigExp } = require('./numbers')(web3)

  const DAI_RATE = bigExp(1, 18)    // 1 DAI = 1 USD

  function inverseRate(rate) {
    // Mimic EVM truncation
    return ONE.pow(bn(2)).div(bn(rate))
    // return ONE.pow(bn(2)).div(bn(rate)).trunc()
  }

  function exchangedAmount(amount, rate, tokenAllocation) {
    // Invert the rate, as we always set the denomination token as the price feed's quote token
    const inversedRate = inverseRate(rate)
    // Mimic EVM calculation and truncation for token conversion
    return amount.mul(bn(inversedRate)).mul(bn(tokenAllocation)).div(ONE.mul(bn(100)))
    // return amount.mul(bn(inversedRate)).mul(bn(tokenAllocation)).div(ONE.mul(bn(100))).trunc()
  }

  const deployDAI = async (sender, finance) => deployTokenAndDeposit(sender, finance, 'DAI')

  async function deployTokenAndDeposit(sender, finance, name = 'ERC20Token', decimals = 18) {
    const MiniMeToken = artifacts.require('MiniMeToken')
    const token = await MiniMeToken.new(ZERO_ADDRESS, ZERO_ADDRESS, 0, name, decimals, 'E20', true) // dummy parameters for minime
    const amount = bigExp(1e18, decimals)
    await token.generateTokens(sender, amount)
    await token.approve(finance.address, amount, { from: sender })
    await finance.deposit(token.address, amount, `Initial ${name} deposit`, { from: sender })
    return token
  }

  return {
    DAI_RATE,
    exchangedAmount,
    deployDAI
  }
}
