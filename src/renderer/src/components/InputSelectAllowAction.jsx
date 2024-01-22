import React from 'react'
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'

const SELECT_ALLOW_ACTION_OPTIONS = [
  {
    label: 'Tắt',
    value: 1
  },
  {
    label: 'Bật',
    value: 2
  },
  {
    label: 'Ngẫu nhiên',
    value: 3
  }
]

// eslint-disable-next-line react/prop-types
const InputSelectAllowAction = ({ name, label, value, onChange, formControlProps }) => {
  const [val, setVal] = React.useState(1)

  React.useEffect(() => {
    switch (JSON.stringify(value)) {
      case JSON.stringify([false]):
        setVal(1)
        break
      case JSON.stringify([true]):
        setVal(2)
        break
      case JSON.stringify([true, false]):
        setVal(3)
        break
    }
  }, [value])

  const handleChange = (e) => {
    const newVal = e.target.value
    let newValue = [false]
    switch (newVal) {
      case 3:
        newValue = [true, false]
        break
      case 2:
        newValue = [true]
        break
      case 1:
      default:
        newValue = [false]
        break
    }
    setVal(newVal)
    onChange(e.target.name, newValue)
  }

  return (
    <FormControl {...formControlProps}>
      <InputLabel id={`${name}-selectAllowAction-label`}>{label}</InputLabel>
      <Select
        labelId={`${name}-selectAllowAction-label`}
        label={label}
        name={name}
        value={val}
        onChange={handleChange}
      >
        {SELECT_ALLOW_ACTION_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default InputSelectAllowAction
