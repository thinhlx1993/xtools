import { net } from 'electron'
import axios from 'axios'
import logger from './logger'
import { mapErrorConstructor } from './helpers'

/**
 *
 * @param {string} key
 * @returns {Promise<[boolean, {user:string;username:string;key:string;start_date:string;expired_date:string;status:"1" | "2" | "3" | "4"}]>} [failure, keyInfo]
 */
const getKeyInfo = (key) => {
  return new Promise((resolve) => {
    const result = [true, null]
    try {
      const url = `https://x2e.pro.vn/pages/api/check-key.php?key=${key}`
      const request = net.request(url)
      request.on('response', (response) => {
        response.on('data', (chunk) => {
          result[0] = false
          result[1] = JSON.parse(chunk)
        })
        response.on('end', () => {
          return resolve(result)
        })
      })
      request.end()
    } catch (error) {
      logger.error('REQUEST_GET_KEY_INFO_ERROR', {
        error: mapErrorConstructor(error)
      })
      return resolve(result)
    }
  })
}

/**
 * @param {'get' | 'post' | 'put'} method
 * @param {string} url
 * @param {{
 *   headers?: {[key: string]: string};
 *   body?: any;
 *   query?: any;
 *   timeout?: number;
 * }} data
 * @returns {Promise<[boolean | string, any]>} [error, response]
 */
const init = (method, url, data) => {
  const requestOptions = { method, url }
  if (data.body) {
    requestOptions.data = data.body
  }
  if (data.headers) {
    requestOptions.headers = data.headers
  }
  if (data.query) {
    requestOptions.query = data.query
  }
  if (data.timeout) {
    requestOptions.timeout = data.timeout
  }
  return axios(requestOptions)
}

export default {
  getKeyInfo,
  init,
}
