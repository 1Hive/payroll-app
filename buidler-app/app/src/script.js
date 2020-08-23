import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { first } from 'rxjs/operators'

import app from './store/app'
import initialize from './store'
import financeAbi from './abi/finance-vault'

retryEvery(async retry => {
  app
    .call('finance')
    .pipe(first())
    .toPromise()
    .then(financeAddress => app.external(financeAddress, financeAbi))
    .then(finance =>
      finance
        .vault()
        .pipe(first())
        .toPromise()
    )
    .then(initialize)
    .catch(err => {
      console.error('Could not start background script execution due:', err)
      retry()
    })
})

/*
 * Calls `callback` exponentially, everytime `retry()` is called.
 *
 * Usage:
 *
 * retryEvery(retry => {
 *  // do something
 *
 *  if (condition) {
 *    // retry in 1, 2, 4, 8 seconds… as long as the condition passes.
 *    retry()
 *  }
 * }, 1000, 2)
 *
 */

function retryEvery(callback, initialRetryTimer = 1000, increaseFactor = 5) {
  const attempt = (retryTimer = initialRetryTimer) => {
    // eslint-disable-next-line standard/no-callback-literal
    callback(() => {
      console.error(`Retrying in ${retryTimer / 1000}s...`)

      // Exponentially backoff attempts
      setTimeout(() => attempt(retryTimer * increaseFactor), retryTimer)
    })
  }

  attempt()
}
