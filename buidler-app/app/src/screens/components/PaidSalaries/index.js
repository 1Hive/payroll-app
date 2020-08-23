import React, { useState } from 'react'
import styled from 'styled-components'
import { Text, DropDown } from '@aragon/ui'
import SalariesChart from './SalariesChart'
import { CHART_TYPES } from './utils'

function PaidSalaries() {
  const [activeFilter, setActiveFilter] = useState(0)

  return (
    <>
      <FilteWrapper>
        <FilterLabel>Paid Salaries</FilterLabel>
        <DropDown
          items={CHART_TYPES}
          selected={activeFilter}
          onChange={setActiveFilter}
        />
      </FilteWrapper>
      <SalariesChart type={CHART_TYPES[activeFilter]} />
    </>
  )
}

export default PaidSalaries

const FilteWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`
const FilterLabel = styled(Text)`
  font-size: 16px;
  font-weight: 600;
`
