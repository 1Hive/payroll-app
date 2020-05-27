import React, { useCallback, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Popover, GU, RADIUS, useTheme } from '@aragon/ui'
import DatePicker from './DatePicker'
import Labels from './Labels'
import { SINGLE_DATE } from './consts'
import { dayjs, dateFormat } from '../../utils/date-utils'
import handleSingleDateSelect from './utils'

function SingleDatePicker({ format, onChange, startDate }) {
  const theme = useTheme()
  const labelsRef = useRef()
  const [showPicker, setShowPicker] = useState(false)

  const handlePopoverClose = useCallback(() => setShowPicker(false), [])

  const handleLabelsClick = useCallback(() => {
    setShowPicker(show => !show)
  }, [])

  const handleDateClick = useCallback(
    date => {
      setShowPicker(false)
      if (date) {
        const result = handleSingleDateSelect({
          date,
          startDate,
        })
        onChange(result.startDate)
      }
    },
    [onChange, startDate]
  )

  const labelProps = useMemo(() => {
    const _startDate = startDate
    return {
      startText: _startDate ? dateFormat(_startDate, format) : SINGLE_DATE,
    }
  }, [format, startDate])

  return (
    <div>
      <Labels
        ref={labelsRef}
        enabled={showPicker}
        hasSetDates={Boolean(startDate)}
        onClick={handleLabelsClick}
        {...labelProps}
      />
      <Popover
        closeOnOpenerFocus
        onClose={handlePopoverClose}
        opener={labelsRef.current}
        placement="bottom-start"
        visible={showPicker}
        css={`
          min-width: ${37.5 * GU + 2}px;
          border: 0;
          filter: none;
          background: none;
          margin: 2px 0 0 0;
        `}
      >
        <div
          css={`
            padding: ${2.5 * GU}px ${3 * GU}px ${3 * GU}px;
            border: 1px solid ${theme.border};
            border-radius: ${RADIUS}px;
            background: ${theme.surface};
          `}
        >
          <div
            css={`
              display: flex;
              flex-direction: row;
              align-items: baseline;
            `}
          >
            <DatePicker
              initialDate={dayjs(startDate || undefined)
                .subtract(0, 'month')
                .toDate()}
              onSelect={handleDateClick}
            />
          </div>

          <div
            css={`
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-top: ${GU * 2.25}px;
            `}
          />
        </div>
      </Popover>
    </div>
  )
}

SingleDatePicker.propTypes = {
  format: PropTypes.string,
  onChange: PropTypes.func,
  startDate: PropTypes.instanceOf(Date),
}

SingleDatePicker.defaultProps = {
  format: 'MM/DD/YYYY',
  onChange: () => {},
}

export default SingleDatePicker
