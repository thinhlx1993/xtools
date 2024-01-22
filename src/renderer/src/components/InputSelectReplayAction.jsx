import { FormControl, InputLabel, Select, MenuItem } from '@mui/material'
import { REPLAY_ACTION_OPTION } from '../helpers/constants'

const SELECT_REPLAY_ACTION_OPTIONS = [
  {
    label: 'Tắt',
    value: REPLAY_ACTION_OPTION.off
  },
  {
    label: 'Bật',
    value: REPLAY_ACTION_OPTION.timeout
  }
]

// eslint-disable-next-line react/prop-types
const InputSelectReplayAction = ({ name, label, value, onChange, formControlProps }) => {
  const handleChange = (e) => onChange(e.target.name, e.target.value)

  return (
    <FormControl {...formControlProps}>
      <InputLabel id={`${name}-selectReplayAction-label`}>{label}</InputLabel>
      <Select
        labelId={`${name}-selectReplayAction-label`}
        label={label}
        name={name}
        value={value}
        onChange={handleChange}
      >
        {SELECT_REPLAY_ACTION_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default InputSelectReplayAction
