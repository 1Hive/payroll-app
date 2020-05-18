import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApi } from '@aragon/api-react'

function noop() {}

export function useExternalContract(address, abi) {
  const api = useApi()
  const canInstantiate = Boolean(api && address && abi)
  const [contract, setContract] = useState(
    canInstantiate ? api.external(address, abi) : null
  )

  useEffect(() => {
    // We assume there is never any reason to set the contract back to null.
    if (canInstantiate && !contract) {
      setContract(api.external(address, abi))
    }
  }, [abi, address, api, canInstantiate, contract])

  return contract
}

export function useNow(updateEvery = 1000) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, updateEvery)
    return () => {
      clearInterval(timer)
    }
  }, [updateEvery])
  return now
}

export function usePromise(fn, memoParams, defaultValue) {
  const [result, setResult] = useState(defaultValue)

  useEffect(() => {
    let cancelled = false

    const promise = typeof fn === 'function' ? fn() : fn
    promise.then(value => {
      if (!cancelled) {
        setResult(value)
      }
    })
    return () => {
      cancelled = true
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...memoParams, fn])
  return result
}

// Handles the state of a panel.
// Pass `onTransitionEnd` to the same SidePanel prop.
export function usePanelState({ onDidOpen = noop, onDidClose = noop } = {}) {
  const [visible, setVisible] = useState(false)

  // `didOpen` is set to `true` when the opening transition of the panel has
  // ended, `false` otherwise. This is useful to know when to start inner
  // transitions in the panel content.
  const [didOpen, setDidOpen] = useState(false)

  const requestOpen = useCallback(() => {
    setVisible(true)
    setDidOpen(false)
  }, [setVisible, setDidOpen])

  const requestClose = useCallback(() => {
    setVisible(false)
  }, [setVisible])

  // To be passed to the onTransitionEnd prop of SidePanel.
  const onTransitionEnd = useCallback(
    opened => {
      if (opened) {
        onDidOpen()
        setDidOpen(true)
      } else {
        onDidClose()
        setDidOpen(false)
      }
    },
    [onDidClose, onDidOpen, setDidOpen]
  )

  return useMemo(
    () => ({ requestOpen, requestClose, visible, didOpen, onTransitionEnd }),
    [requestOpen, requestClose, visible, didOpen, onTransitionEnd]
  )
}
