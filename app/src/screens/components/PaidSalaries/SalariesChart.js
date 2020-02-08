import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { useAppState } from '@aragon/api-react'

import { LineChart } from '@aragon/ui'

import { CHART_TYPES, chartSettings, getDurationSlices } from './utils'

function SalariesChart({ type }) {
  const { payments = [] } = useAppState()
  const [lines, setLines] = useState([])
  const [labels, setLabels] = useState([])
  const total = getDurationSlices[type](labels)

  const setSettingsAndLabels = ({ settings, labels }) => {
    setLines(settings)
    setLabels(labels)
  }

  useEffect(() => {
    setSettingsAndLabels(chartSettings(type, payments))
  }, [payments.length, type])

  return (
    <ChartWrapper>
      <LineChart
        lines={lines}
        total={total}
        label={i => labels[i]}
        width={200}
        reset
      />
    </ChartWrapper>
  )
}

SalariesChart.propTypes = {
  type: PropTypes.oneOf(CHART_TYPES),
}

const ChartWrapper = styled.div`
  padding: 20px 0;
  display: flex:
`

export default SalariesChart
