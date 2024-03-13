export const convertToLocalDateTime = (utcDateString) => {
  try {
    // Parse the input string into separate components
    const [day, month, year, hour, minute] = utcDateString.split(/[ :\-]/)

    // Create a Date object using the parsed components
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute))

    // Define options for formatting
    const options = {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      timeZone: 'UTC' // Ensure the date is treated as UTC
    }

    // Use toLocaleString to convert the date to a local string
    return date.toLocaleString(undefined, options)
  } catch (error) {
    return `${utcDateString} UTC`
  }
}
