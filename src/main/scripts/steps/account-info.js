import puppeteer from 'puppeteer-core'
import { PAGE_URL } from '../constants'
import { regGraphAPIUserByScreenName } from '../regex'
import { homePathSelector } from '../path-selector'

/**
 * @param {puppeteer.Page} page Puppeteer page
 * @returns {Promise<{
 *   profileId: string;
 *   screenName: string;
 *   displayName: string;
 * } | undefined>}
 */
export default async (page) => {
  if (page.url() !== PAGE_URL.home) {
    await page.goto(PAGE_URL.home, { waitUntil: 'domcontentloaded' })
  }
  await page.waitForSelector(homePathSelector.profileLink, {
    visible: true,
    timeout: 30000
  })
  await page.click(homePathSelector.profileLink)
  const response = await page.waitForResponse(
    (response) => regGraphAPIUserByScreenName.test(response.url()) && response.status() === 200
  )
  const userResponse = await response.json()
  return {
    profileId: userResponse.data.user.result.rest_id,
    screenName: userResponse.data.user.result.legacy.screen_name,
    displayName: userResponse.data.user.result.legacy.name
  }
}
