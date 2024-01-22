import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { STOP_ACTION_OPTION } from '../helpers/constants'

const SELECT_STOP_ACTION_OPTIONS = [
  {
    label: 'Ngẫu nhiên số bài đăng',
    value: STOP_ACTION_OPTION.randomTotalPosts
  },
  {
    label: 'Thời gian',
    value: STOP_ACTION_OPTION.timeout
  }
]

// eslint-disable-next-line react/prop-types
const InputSelectStopAction = ({ name, label, value, onChange, formControlProps }) => {
  const handleChange = (e) => onChange(e.target.name, e.target.value)

  return (
    <FormControl {...formControlProps}>
      <InputLabel id={`${name}-selectStopAction-label`}>{label}</InputLabel>
      <Select
        labelId={`${name}-selectStopAction-label`}
        label={label}
        name={name}
        value={value}
        onChange={handleChange}
      >
        {SELECT_STOP_ACTION_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default InputSelectStopAction
