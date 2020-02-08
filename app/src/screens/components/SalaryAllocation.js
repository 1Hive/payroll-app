import React, { useState } from 'react'
import styled from 'styled-components'
import { Button, Box, PartitionBar } from '@aragon/ui'

//import PartitionBar from '../../components/Bar/PartitionBar'
//import { EditSalaryAllocation } from '../../panels'

const EditSalaryAllocation = ()=> <div/>


const EditButton = styled(Button).attrs({ mode: 'secondary' })`
  align-self: flex-end;
`

const SalaryAllocation = ({ salaryAllocation }) => {
  const [isEditing, setIsEditing] = useState(false)

  const startEditing = () => {
    setIsEditing(true)
  }

  const endEditing = () => {
    setIsEditing(false)
  }

  return (
    <Box heading="Salary allocation">
      {salaryAllocation && <PartitionBar data={salaryAllocation} />}

      <EditButton onClick={startEditing}>Edit salary allocation</EditButton>

      <EditSalaryAllocation opened={isEditing} onClose={endEditing} />
    </Box>
  )
}

export default SalaryAllocation
