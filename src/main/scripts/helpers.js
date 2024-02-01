'use strict'
// eslint-disable-next-line no-unused-vars
const puppeteer = require('puppeteer-core')
import utils from './utils'
import { regGraphAPIUserTws, regGraphAPITwDetail, regGraphAPIHomeTimeline } from './regex'
import { TWEET_INSTRUCTION_TYPE } from './constants'
import logger from '../logger'

/**
 *
 * @param {puppeteer.Page} page
 * @param {string} proxy
 */
export const authenticateProxy = (page, proxy) => {
  if (!proxy) {
    return
  }
  const proxyParts = proxy.split(':')
  return page.authenticate({
    username: proxyParts[2],
    password: proxyParts[3]
  })
}

/**
 *
 * @param {RegExp} reg
 * @param {puppeteer.HTTPRequest | puppeteer.HTTPResponse} event
 */
export const testRegHttpEvent = (reg, event) => {
  const url = event.url()
  const urlParts = new URL(url)
  const href = `${urlParts.origin}${urlParts.pathname}`
  return reg.test(href)
}

/**
 *
 * @param {puppeteer.Page} page
 * @param {number} scrollHeight
 */
export const windowScrollBy = async (page, scrollHeight) => {
  // console.log('windowScrollBy')
  const scrollAmount = 50
  let currentScroll = 0
  while (currentScroll < Math.floor(scrollHeight)) {
    const topValue =
      currentScroll + scrollAmount > scrollHeight
        ? Math.floor(scrollHeight - currentScroll)
        : scrollAmount
    // Adjust the desired scroll position
    await page.evaluate(
      new Function('topValue', `return window.scrollBy({ top: topValue, behavior: 'smooth' })`),
      topValue
    )
    // await page.evaluate((topValue) => {
    //   window.scrollBy({
    //     top: topValue,
    //     behavior: 'smooth'
    //   })
    // }, topValue)
    await utils.delayRandom([80, 90, 100, 110, 120, 130])
    currentScroll += topValue
  }
  // console.log('windowScrollBy__done')
}

/**
 *
 * @param {puppeteer.Page} page
 */
export const windowScrollByToTop = async (page) => {
  console.log('windowScrollByToTop')
  const scrollAmount = 300
  let currentScroll = 0
  const currentScrollY = await page.evaluate(new Function('return window.scrollY'))
  // const currentScrollY = await page.evaluate(() => {
  //   return window.scrollY
  // })
  while (currentScroll < currentScrollY) {
    // Adjust the desired scroll position
    await page.evaluate(
      new Function(
        'scrollAmount',
        `return window.scrollBy({ top: -scrollAmount, behavior: 'smooth' })`
      ),
      scrollAmount
    )
    // await page.evaluate((scrollAmount) => {
    //   console.log('scrollAmount', scrollAmount)
    //   window.scrollBy({
    //     top: -scrollAmount,
    //     behavior: 'smooth'
    //   })
    // }, scrollAmount)
    await utils.delayRandom([80, 90, 100, 110, 120, 130])
    currentScroll += scrollAmount
  }
  console.log('windowScrollByToTop__done')
}

export const getTweetStatusPath = (profileId, postId) => `/${profileId}/status/${postId}`

/**
 *
 * @param {puppeteer.Page} page
 * @param {RegExp} regex
 * @param {(responseBody) => void} callback
 */
const _handleResponse = (page, regex, callback) => {
  page.on('response', async (event) => {
    if (!testRegHttpEvent(regex, event) || event.status() !== 200) {
      return
    }
    const responseBody = await event.json()
    callback(responseBody)
  })
}

/**
 *
 * @param {puppeteer.Page} page
 * @param {(data: {
 *   pinEntry: object;
 *   addEntries: object[];
 * }) => void} callback
 */
export const handleResponseUserTweets = (page, callback) =>
  _handleResponse(page, regGraphAPIUserTws, (responseBody) => {
    logger.info(`Handle response user tweets`)
    const pinEntry = responseBody.data.user.result.timeline_v2.timeline.instructions.find(
      (instruction) => instruction.type === TWEET_INSTRUCTION_TYPE.timeLinePin
    )?.entry
    const addEntries = responseBody.data.user.result.timeline_v2.timeline.instructions.find(
      (instruction) => instruction.type === TWEET_INSTRUCTION_TYPE.timeLineAdd
    )?.entries
    callback({ pinEntry, addEntries })
  })

/**
 *
 * @param {puppeteer.Page} page
 * @param {(data: {
 *   addEntries: object[];
 * }) => void} callback
 */
export const handleResponseTweetDetail = (page, callback) =>
  _handleResponse(page, regGraphAPITwDetail, (responseBody) => {
    const addEntries =
      responseBody.data.threaded_conversation_with_injections_v2.instructions.find((instruction) =>
        instruction.type === TWEET_INSTRUCTION_TYPE.timeLineAdd ? instruction.entries : []
      )?.entries || []
    callback({ addEntries })
  })

/**
 *
 * @param {puppeteer.Page} page
 * @param {(data: {
 *   addEntries: object[];
 * }) => void} callback
 */
export const handleResponseHomeTimeline = (page, callback) =>
  _handleResponse(page, regGraphAPIHomeTimeline, (responseBody) => {
    const addEntries =
      responseBody.data.home.home_timeline_urt.instructions.find((instruction) =>
        instruction.type === TWEET_INSTRUCTION_TYPE.timeLineAdd ? instruction.entries : []
      )?.entries || []
    callback({ addEntries })
  })
