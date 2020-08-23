import React from 'react'
import MySalary from '../components/MyPayroll/MySalary'
import PreviousSalary from '../components/MyPayroll/PreviousSalary'

function MyPayroll({ isSyncing }) {
  return (
    <div>
      {!isSyncing && (
        <>
          <MySalary />
          <PreviousSalary />
        </>
      )}
    </div>
  )
}

export default React.memo(MyPayroll)
