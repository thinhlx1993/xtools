export const convertToLocalDateTime = (utcDateString) => {
  const date = new Date(utcDateString + 'Z')
  const options = {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  }
  return date.toLocaleString(undefined, options)
}
