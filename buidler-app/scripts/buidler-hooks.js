let accounts
let finance, tokens, vault
let token

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

module.exports = {
  postDao: async function({ _experimentalAppInstaller, log }, bre) {
    const bigExp = (x, y) =>
      bre.web3.utils
        .toBN(x)
        .mul(bre.web3.utils.toBN(10).pow(bre.web3.utils.toBN(y)))
    const pct16 = x => bigExp(x, 16)

    // Retrieve accounts.
    accounts = await bre.web3.eth.getAccounts()

    vault = await _experimentalAppInstaller('vault')
    log(`> Vault app installed: ${vault.address}`)

    finance = await _experimentalAppInstaller('finance', {
      initializeArgs: [
        vault.address,
        60 * 60 * 24 * 30, // 30 days
      ],
    })
    log(`> Finance app installed: ${finance.address}`)

    // Deploy a minime token an generate tokens to root account
    const minime = await deployMinimeToken(bre)
    await minime.generateTokens(accounts[0], pct16(100))
    log(`> Minime token deployed: ${minime.address}`)

    tokens = await _experimentalAppInstaller('token-manager', {
      skipInitialize: true,
    })

    await minime.changeController(tokens.address)
    log(`> Change minime controller to tokens app`)
    await tokens.initialize([minime.address, true, 0])
    log(`> Tokens app installed: ${tokens.address}`)

    await deployTokens(bre.artifacts)
  },

  postInit: async function({ proxy, log }, bre) {
    await vault.createPermission('TRANSFER_ROLE', proxy.address)
    log(`> TRANSFER_ROLE assigned to ${proxy.address}`)
    await finance.createPermission('CREATE_PAYMENTS_ROLE', proxy.address)
    log(`> CREATE_PAYMENTS_ROLE assigned to ${proxy.address}`)
    await tokens.createPermission('MINT_ROLE', proxy.address)
    log(`> MINT_ROLE assigned to ${proxy.address}`)
  },

  getInitParams: async function({}, bre) {
    const equityMultiplier = 4
    const vestingLength = 0
    const vestingCliffLength = 0
    const vestingRevokable = true

    return [
      finance.address,
      token.address,
      tokens.address,
      equityMultiplier,
      vestingLength,
      vestingCliffLength,
      vestingRevokable,
    ]
  },
}

async function deployTokens(artifacts) {
  token = await deployToken(
    'Dai Stablecoin',
    'DAI',
    18,
    4500,
    accounts[0],
    artifacts
  )
  console.log(`> ERC20 token deployed: ${token.address}`)
}

async function deployToken(
  tokenName,
  tokenSymbol,
  decimals,
  initialSupply,
  fromAccount,
  artifacts
) {
  const ERC20 = artifacts.require('ERC20Mock')

  return ERC20.new(tokenName, tokenSymbol, decimals, initialSupply, {
    from: fromAccount,
  })
}

async function deployMinimeToken(bre) {
  const MiniMeToken = await bre.artifacts.require('MiniMeToken')
  const token = await MiniMeToken.new(
    ZERO_ADDRESS,
    ZERO_ADDRESS,
    0,
    'MiniMe Token',
    18,
    'MMT',
    true
  )
  return token
}
