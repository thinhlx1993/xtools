import { authenticateProxy, testRegHttpEvent } from '../helpers'
import { loginPathSelector } from '../path-selector'
import { updateProfileData } from '../services/backend'
import { regHomePageUrl, regGraphAPIHomeTimeline, regGraphAPIDataSaverMode } from '../regex'
import { DOMAIN_COOKIE, PAGE_URL } from '../constants'
import logger from '../../logger'
import utils from '../utils'

export const handleCookies = async (browser, account) => {
  const page = await browser.newPage()
  await authenticateProxy(page, account.proxy)
  if (account.cookies) {
    const cookieObj = account.cookies
      .split(';')
      .filter(Boolean)
      .reduce((result, cookieParam) => {
        const cookieParamParts = cookieParam.split(/=(.*)/s)
        if (cookieParamParts.length > 1) {
          result.push({
            name: cookieParamParts[0].trim(),
            value: cookieParamParts[1],
            domain: DOMAIN_COOKIE
          })
        }
        return result
      }, [])
    await page.setCookie(...cookieObj)
    // if (account.screenName) {
    //   return page;
    // }
    await page.goto(PAGE_URL.home, { waitUntil: 'domcontentloaded' })
    await page
      .waitForResponse(
        (response) =>
          (testRegHttpEvent(regGraphAPIDataSaverMode, response) ||
            testRegHttpEvent(regGraphAPIHomeTimeline, response)) &&
          response.status() === 200,
        { timeout: 60000 }
      )
      .catch((error) => {
        logger.error(error)
      })
    await utils.delay()
    if (!regHomePageUrl.test(page.url())) {
      throw new Error('Cookie has some problem')
    }
    return page
  }
  await cacheCookies(page, account.profile_id)
  return page
}

/**
 *
 * @param {puppeteer.Page} page
 * @param {string} accountId
 */
export const cacheCookies = async (browser, accountId) => {
  const page = await browser.newPage()
  await page.goto('https://twitter.com')
  const buttons = await page.$$(loginPathSelector.layerBottomBarUseCookieBtn)
  if (buttons.length === 2) {
    return await buttons[0].click()
  }
  const cookies = await page.cookies()
  const cookieString = cookies.reduce((result, cookie) => {
    if (['.twitter.com', 'twitter.com'].includes(cookie.domain)) {
      result += `${cookie.name}=${cookie.value};`
    }
    return result
  }, '')
  await updateProfileData(accountId, { cookies: cookieString })
}
