import app from './app'
import { first, map } from 'rxjs/operators'
import tokenSymbolAbi from '../abi/token-symbol'
import tokenDecimalsAbi from '../abi/token-decimals'
import tokenManagerTokenAbi from '../abi/token_manager_token.json'
import tokenManagerMaxVestingsAbi from '../abi/token_manager_max_vestings.json'

const tokenCache = new Map()

export function getDenominationToken() {
  return app
    .call('denominationToken')
    .pipe(first())
    .pipe(map(getToken))
    .toPromise()
}

export async function getEquityTokenManager() {
  const tokenManagerAddress = await app
    .call('equityTokenManager')
    .pipe(first())
    .toPromise()

  const tokenManagerContract = await app.external(tokenManagerAddress, [
    ...tokenManagerTokenAbi,
    ...tokenManagerMaxVestingsAbi,
  ])

  const tokenAddress = await tokenManagerContract.token().toPromise()
  const maxVestings = await tokenManagerContract
    .MAX_VESTINGS_PER_ADDRESS()
    .toPromise()

  return {
    address: tokenManagerAddress,
    token: await getToken(tokenAddress),
    maxVestings,
  }
}

export async function getToken(address) {
  if (!tokenCache.has(address)) {
    const [decimals, symbol] = await Promise.all([
      loadTokenDecimals(address),
      loadTokenSymbol(address),
    ])

    tokenCache.set(address, { address, decimals, symbol })
  }

  return tokenCache.get(address)
}

function loadTokenDecimals(address) {
  return app
    .external(address, tokenDecimalsAbi)
    .decimals()
    .pipe(first())
    .pipe(map(value => parseInt(value)))
    .toPromise()
}

function loadTokenSymbol(address) {
  return app
    .external(address, tokenSymbolAbi)
    .symbol()
    .pipe(first())
    .toPromise()
}
