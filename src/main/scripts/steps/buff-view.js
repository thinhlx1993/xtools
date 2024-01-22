// import puppeteer from 'puppeteer-core'
import { authenticateProxy, testRegHttpEvent } from '../helpers'
import { PAGE_URL } from '../constants'
import logger from '../../logger'
import {
  regTwDomain,
  regXDomain,
  regHttp,
  regParamEntryDetailUrl,
  regAPIClientEvent
} from '../regex'
import utils from '../utils'
import { mapErrorConstructor } from '../../helpers'
import request from '../../request'

const NUMBER_REQ_PER_REFRESH = 500
const MAX_ERROR_PER_REFRESH = 5
const MAX_ERROR_REFRESH = 10
const dataMemories = {}

/**
 *
 * @param {puppeteer.Page} page
 * @param {string} entryUrl
 */
const _getLogEventViewPostDetail = async (page, entryUrl) => {
  await page.goto(PAGE_URL.subpath(entryUrl))
  const [httpRequest, httpResponse] = await Promise.all([
    page.waitForRequest((response) => testRegHttpEvent(regAPIClientEvent, response), {
      timeout: 10000
    }),
    page.waitForResponse(
      (response) => {
        if (!testRegHttpEvent(regAPIClientEvent, response)) {
          return false
        }
        const postData = response.request().postData()
        return (
          postData &&
          decodeURIComponent(postData).includes(
            '"event_namespace":{"page":"tweet","action":"show","client":"m5"}'
          )
        )
      },
      { timeout: 10000 }
    )
  ])

  const requestMethod = httpRequest.method()
  const requestUrl = httpRequest.url()
  const requestBody = httpResponse.request().postData()
  const requestHeaders = httpRequest.headers()
  const reqHeaders = [
    'authority',
    'authorization',
    'content-type',
    'cookie',
    'origin',
    'referer',
    'x-client-transaction-id',
    'x-client-uuid',
    'x-csrf-token'
  ].reduce((result, key) => {
    const value = requestHeaders[key]
    if (value) {
      result[key] = value
    }
    return result
  }, {})

  return {
    method: requestMethod,
    url: requestUrl,
    headers: reqHeaders,
    body: requestBody
  }
}

/**
 * @param {puppeteer.Browser} browser
 * @param {{
 *   id: number;
 *   proxy: string;
 * }} account The Account
 * @param {{
 *   entryDetailUrls: string;
 *   mixRandomEntryDetailUrls: boolean;
 *   totalViews: number;
 * }} featOptions The featOptions object
 * @param {string} entryUrl
 */
const _base = async (browser, account, featOptions, entryUrl) => {
  const page = await browser.newPage()
  await authenticateProxy(page, account.proxy)
  await page.setCacheEnabled(false)
  let leftTotal = JSON.parse(JSON.stringify(featOptions.totalViews))
  if (leftTotal <= 0) {
    return
  }
  try {
    await page.setRequestInterception(true)
    await page.setBypassServiceWorker(true)
    page.on('request', (interceptedRequest) => {
      interceptedRequest.continue()
    })

    let countErrorPerRefresh = 0
    let countRefreshError = 0
    while (leftTotal > 0) {
      console.log('=======', account.id)
      console.log('leftTotal', leftTotal)
      console.log('countRefreshError', countRefreshError)
      console.log('=======', account.id)
      try {
        const requestData = await _getLogEventViewPostDetail(page, entryUrl).catch((error) => null)
        if (!requestData) {
          if (countRefreshError >= MAX_ERROR_REFRESH) {
            logger.error('IS_MAX_ERROR_REFRESH')
            return
          }
          countRefreshError++
          continue
        }
        leftTotal--
        countRefreshError = 0
        await Promise.all(
          Array.from(
            Array(leftTotal < NUMBER_REQ_PER_REFRESH ? leftTotal : NUMBER_REQ_PER_REFRESH)
          ).map(async () => {
            const result = await request
              .init(requestData.method, requestData.url, {
                headers: requestData.headers,
                body: requestData.body
              })
              .then(() => [false])
              .catch((error) => {
                logger.error('INIT_REQUEST_PUT_LOG_VIEW_ERROR', {
                  error: mapErrorConstructor(error),
                  accountId: account.id,
                  entryUrl
                })
                return [true]
              })
            if (!result[0]) {
              leftTotal--
              console.log('leftTotal', account.id, leftTotal)
            }
          })
        )
        countErrorPerRefresh = 0
      } catch (error) {
        console.log('page.isClosed()', page.isClosed())
        if (page.isClosed()) {
          return
        }
        logger.error('BUFF_VIEW_PER_REFRESH_ERROR', {
          error: mapErrorConstructor(error),
          accountId: account.id,
          entryUrl
        })
        countErrorPerRefresh++
        continue
      }
      if (countErrorPerRefresh >= MAX_ERROR_PER_REFRESH) {
        logger.info('IS_MAX_ERROR_PER_REFRESH')
        return
      }
    }
  } catch (error) {
    logger.error('BUFF_VIEW_ERROR', {
      error: mapErrorConstructor(error),
      accountId: account.id,
      entryUrl,
      leftTotal,
      total: featOptions.totalViews
    })
  } finally {
    await page.close()
  }
}

/**
 * @param {puppeteer.Browser} browser the Puppeteer Browser
 * @param {{
 *   id: number;
 *   proxy: string;
 * }} account The Account
 * @param {{
 *   entryDetailUrls: string;
 *   mixRandomEntryDetailUrls: boolean;
 *   totalViews: number;
 * }} featOptions The featOptions object
 */
const init = async (browser, account, featOptions) => {
  console.log('start buff view func')
  dataMemories[account.id] = {}
  let entryUrls = featOptions.entryDetailUrls
    .split('\n')
    .map((url) => {
      let newUrl = url.trim()
      if (regHttp.test(newUrl) && !regTwDomain.test(newUrl) && !regXDomain.test(newUrl)) {
        return
      }
      const result = newUrl.match(regParamEntryDetailUrl)
      return result ? `/${result[0]}` : undefined
    })
    .filter(Boolean)
  if (featOptions.mixRandomEntryDetailUrls) {
    entryUrls = utils.shuffle(entryUrls)
  }
  for (let index = 0; index < entryUrls.length; index++) {
    try {
      const entryUrl = entryUrls[index]
      await _base(browser, account, featOptions, entryUrl)
      await utils.delayRandom([5000, 6000, 7000, 8000, 9000, 1000])
    } catch (error) {
      if (!dataMemories[account.id]) {
        return
      }
      throw error
    }
  }
  console.log('follow buff view done')
}

const stop = (accountId) => {
  delete dataMemories[accountId]
}

export default {
  init,
  stop,
}
