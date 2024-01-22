/* eslint-disable react/prop-types */
import React from 'react'
import { Box, FormControlLabel, TextField, Typography } from '@mui/material'

const InputFromToNumber = ({ label, values, onChange }) => {
  const [data, setData] = React.useState({ from: 1, to: 1 })

  const handleChange = (event) => {
    const newValue = Number(event.target.value)
    switch (event.target.name) {
      case 'from':
        if (newValue > data.to) {
          return
        }
        break
      case 'to':
        if (newValue < data.from) {
          return
        }
        break
      default:
        break
    }
    const newData = {
      ...data,
      [event.target.name]: Number(event.target.value)
    }
    setData(newData)
    onChange && onChange(`${newData.from},${newData.to}`)
  }

  React.useEffect(() => {
    if (!values) {
      return
    }
    const parts = values.split(',')
    setData({ from: parts[0], to: parts[1] })
  }, [values])

  return (
    <FormControlLabel
      label={
        <Typography variant="caption" gutterBottom sx={{ width: '100%', mb: 0 }}>
          {label}
        </Typography>
      }
      labelPlacement="top"
      sx={{ pb: 1.5, m: 0 }}
      control={
        <Box sx={{ '& .MuiTextField-root': { mr: 1, width: '70px' } }}>
          <TextField
            type="number"
            inputProps={{
              min: 1,
              value: data.from
            }}
            value={data.from}
            // defaultValue={data[0]}
            size="small"
            helperText="Từ"
            variant="standard"
            name="from"
            onChange={handleChange}
          />
          <TextField
            type="number"
            inputProps={{
              min: 1,
              value: data.to
            }}
            value={data.to}
            // defaultValue={data[1]}
            size="small"
            helperText="Đến"
            variant="standard"
            name="to"
            onChange={handleChange}
          />
        </Box>
      }
    />
  )
}

export default InputFromToNumber
