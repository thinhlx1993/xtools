import axios from 'axios'
import { HIDE_MY_ACC_API_ROOT } from '../constants'
import { mapErrorConstructor } from '../helpers'
import logger from '../logger'
import { HideMyAcc } from '../scripts/define-type'
import utils from '../scripts/utils'

/**
 * @typedef {Object} Timezone
 * @property {string} ip
 * @property {string} timezone
 * @property {[string, string]} ll
 * @property {string} country
 * @property {string} region
 * @property {string} city
 */

let _apiRoot = HIDE_MY_ACC_API_ROOT
let _isGettingToken = false
let _token

/**
 *
 * @param {HideMyAcc} account
 * @returns {Promise<{
 *   code: 0 | 1;
 *   result: {
 *     token: string;
 *     user: {
 *       id: string;
 *       email: string;
 *       contacts: object[];
 *       profiles: number;
 *       plan: object;
 *     }
 *   }
 * }>}
 */
const login = (account) =>
  axios({
    method: 'POST',
    baseURL: _apiRoot,
    url: '/auth',
    headers: {
      Authorization: `Basic ${btoa(`${account.username}:${account.password}`)}`
    },
    data: {
      version: account.version
    }
  }).then((res) => res.data)

/**
 *
 * @param {HideMyAcc} account
 * @returns {Promise<string|undefined>}
 */
const getToken = async (account) => {
  if (_token) return _token
  if (_isGettingToken) {
    await utils.delay(1000)
    return getToken(account)
  }
  _isGettingToken = true
  try {
    const response = await login(account)
    if (response.code === 1) {
      _token = response.result.token
    }
    return _token
  } catch (error) {
    logger.error('HIDEMYACC__GET_TOKEN_ERROR', {
      error: mapErrorConstructor(error)
    })
  } finally {
    _isGettingToken = false
  }
}

/**
 *
 * @param {string} token
 * @param {{
 *   name: string;
 *   os: 'mac' | 'win'
 *   browserVersion: number;
 * }} options
 * @returns {Promise<{
 *   code: 0 | 1;
 *   result: {
 *     id: string;
 *   }
 * }>}
 */
const createProfile = (token, options) =>
  axios({
    method: 'POST',
    baseURL: _apiRoot,
    url: '/browser/marco',
    headers: {
      Authorization: `Bearer ${token}`
    },
    data: {
      name: 'Profile name',
      os: 'win',
      uploadCookiesToServer: false,
      uploadBookmarksToServer: false,
      uploadHistoryToServer: false,
      uploadLocalStorageToServer: false,
      resolution: '1920x1080',
      canvasMode: 'noise',
      clientRectsMode: 'noise',
      audioContextMode: 'noise',
      webGLImageMode: 'noise',
      webGLMetadataMode: 'noise',
      versionCode: 3049,
      ...options
    }
  }).then((res) => res.data)

/**
 *
 * @param {string} token
 * @param {string} profileId
 * @param {{name: string}} options
 * @returns {Promise<{
 *   code: 0 | 1;
 *   result: {
 *     id: string;
 *   }
 * }>}
 */
const updateProfile = (token, profileId, options) =>
  axios({
    method: 'PUT',
    baseURL: _apiRoot,
    url: `/browser/${profileId}`,
    headers: {
      Authorization: `Bearer ${token}`
    },
    data: {
      ...options
    }
  }).then((res) => res.data)

/**
 *
 * @param {{
 *   protocol: 'http' | 'https';
 *   host: string;
 *   port: number,
 *   auth: {
 *     username: string;
 *     password: string;
 *   }
 * }} proxy
 * @returns {Promise<Timezone>}
 */
const network = (proxy) =>
  axios
    .get('https://time.hidemyacc.com/', {
      proxy
    })
    .then((res) => res.data).catch((e)=> console.log(e))

/**
 *
 * @param {string} token
 * @param {string} profileId
 * @param {Timezone} tz
 * @returns {Promise<{
 *   code: 0 | 1;
 *   result: string;
 * }>}
 */
const getProfileData = (token, profileId, tz) =>
  axios({
    method: 'POST',
    baseURL: _apiRoot,
    url: `/browser/marco/data/${profileId}`,
    headers: {
      Authorization: `Bearer ${token}`
    },
    data: {
      tz
    }
  }).then((res) => res.data)

/**
 *
 * @param {string} token
 * @param {string} profileId
 * @returns
 */
const deleteProfile = (token, profileId) =>
  axios({
    method: 'DELETE',
    baseURL: _apiRoot,
    url: `/browser/${profileId}`,
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

export default {
  login,
  getToken,
  createProfile,
  updateProfile,
  network,
  getProfileData,
  deleteProfile
}
