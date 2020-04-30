function appStateReducer(state) {
  console.log('state', state)
  if (state === null) {
    return { isSyncing: true }
  }
  return state
}

export default appStateReducer
