/**
 *
 * @param {number} time
 * @returns
 */
export const delay = (time = 1000) => new Promise((resolve) => setTimeout(() => resolve(), time))

/**
 *
 * @param {any[]} values
 */
export const random = (values) => values[Math.floor(Math.random() * values.length)]

/**
 *
 * @param {number[]} times
 * @returns
 */
export const delayRandom = (times = [2000, 2500, 3000, 3500]) => delay(random(times))

export const shuffle = (array) => {
  let currentIndex = array.length,
    randomIndex

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--

    // And swap it with the current element.
    ;[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
  }

  return array
}

export const randomArrayNumberInString = (arrayString, splitter = ',') => {
  const parts = arrayString.split(splitter)
  const start = Number(parts[0])
  const end = Number(parts[1])
  const list = []
  for (var i = start; i <= end; i++) {
    list.push(i)
  }
  return random(list)
}

/**
 *
 * @param {*} arrayString
 * @param {{
 *   splitter?: string;
 *   unit?: 'minute' | 'second' | 'millisecond';
 * }} options
 */
export const delayRandomByArrayNumberInString = (arrayString, options = {}) => {
  const splitter = options.splitter || ','
  let time = randomArrayNumberInString(arrayString, splitter)
  switch (options.unit) {
    case 'minute':
      time = time * 60000
      break
    case 'second':
      time = time * 1000
      break
    case 'millisecond':
    default:
      break
  }
  return delay(time)
}

export default {
  delay,
  random,
  delayRandom,
  shuffle,
  randomArrayNumberInString,
  delayRandomByArrayNumberInString
}
