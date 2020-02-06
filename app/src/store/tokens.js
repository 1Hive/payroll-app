import app from './app'
import tokenDecimalsAbi from '../abi/token-decimals'
import tokenSymbolAbi from '../abi/token-symbol'
import { first, map } from 'rxjs/operators'

const tokenCache = new Map()

export function getDenominationToken() {
  return app
    .call('denominationToken')
    .pipe(first())
    .pipe(map(getToken))
    .toPromise()
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
