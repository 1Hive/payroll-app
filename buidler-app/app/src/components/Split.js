import React, { useMemo } from 'react'
import { GU, useLayout } from '@aragon/ui'

function Split({ children }) {
  const { layoutName } = useLayout()

  const columns = useMemo(() => {
    if (layoutName === 'small') {
      return '1fr'
    }

    if (layoutName === 'medium') {
      return 'repeat(auto-fit, minmax(300px, auto))'
    }

    return '1fr 1fr 2fr'
  }, [layoutName])

  return (
    <div
      css={`
        display: grid;
        grid-template-columns: ${columns};
        grid-gap: ${2 * GU}px;
        margin-bottom: ${2 * GU}px;
        ${layoutName === 'medium' &&
          `& > :last-child {
            grid-column: span 2;
          }`}
      `}
    >
      {children}
    </div>
  )
}

export default Split
