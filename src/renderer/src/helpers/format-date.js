export const convertToLocalDateTime = (utcDateString) => {
  const date = new Date(utcDateString + 'Z')
  return date.toLocaleString()
}
