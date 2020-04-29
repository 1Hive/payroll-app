function appStateReducer(state) {
  if (state === null) {
    return { isSyncing: true }
  }
  return state
}

export default appStateReducer
