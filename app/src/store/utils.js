import BN from 'bn.js'

export function sum(a, b) {
  return new BN(a).add(new BN(b)).toString()
}
