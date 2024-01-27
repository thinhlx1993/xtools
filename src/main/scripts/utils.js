/**
 *
 * @param {number} time
 * @returns
 */
export const delay = (time = 1000) =>
  new Promise((resolve) => setTimeout(() => resolve(), time));

/**
 *
 * @param {any[]} values
 */
export const random = (values) => values[Math.floor(Math.random() * values.length)];

/**
 *
 * @param {number[]} times
 * @returns
 */
export const delayRandom = (times = [2000, 2500, 3000, 3500]) => delay(random(times));

export const shuffle = (array) => {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

export const randomArrayNumberInString = (arrayString, splitter = ",") => {
  const parts = arrayString.split(splitter);
  const start = Number(parts[0]);
  const end = Number(parts[1]);
  const list = [];
  for (var i = start; i <= end; i++) {
    list.push(i);
  }
  return random(list);
};

/**
 *
 * @param {*} arrayString
 * @param {{
 *   splitter?: string;
 *   unit?: 'minute' | 'second' | 'millisecond';
 * }} options
 */
export const delayRandomByArrayNumberInString = (arrayString, options = {}) => {
  const splitter = options.splitter || ",";
  let time = randomArrayNumberInString(arrayString, splitter);
  switch (options.unit) {
    case "minute":
      time = time * 60000;
      break;
    case "second":
      time = time * 1000;
      break;
    case "millisecond":
    default:
      break;
  }
  return delay(time);
};

import fs from 'fs';
import { getAppPath } from '../utils';

function readJsonFile(subPath) {
  const filePath = getAppPath(subPath); // Use getAppPath to get the full path
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } else {
      console.log('JSON file not found. A new file will be created.');
      return [];
    }
  } catch (error) {
    console.error('Error occurred while reading JSON file:', error);
    return [];
  }
}

// Async function to write JSON file
async function writeJsonFile(subPath, newData) {
  const filePath = getAppPath(subPath); // Use getAppPath to get the full path
  try {
    let existingData = [];

    // Check if the file exists and read existing data asynchronously
    try {
      const fileContents = await fs.promises.readFile(filePath, 'utf8');
      existingData = JSON.parse(fileContents);
    } catch (readError) {
      console.log('JSON file not found or unreadable. Starting with an empty array.');
    }

    // Remove duplicates based on "username" and "phone" fields
    const uniqueData = existingData.filter((existingItem) => {
      const matchingNewData = newData.find((newItem) => {
        return (
          existingItem.username === newItem.username &&
          (existingItem.phone !== "" || newItem.phone === "") // Keep the last entry if phone is not empty
        );
      });
      return matchingNewData === undefined;
    });

    // Combine unique data with new data
    const combinedData = [...uniqueData, ...newData];

    // Write the combined data to the file asynchronously
    await fs.promises.writeFile(filePath, JSON.stringify(combinedData, null, 2), 'utf8');
    console.log('JSON file updated successfully');
  } catch (error) {
    console.error('Error writing JSON file:', error);
  }
}

export default {
  delay,
  random,
  delayRandom,
  shuffle,
  randomArrayNumberInString,
  delayRandomByArrayNumberInString,
  writeJsonFile,
  readJsonFile
}
