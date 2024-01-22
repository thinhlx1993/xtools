import { authenticateProxy } from '../helpers'
import { loginPathSelector } from '../path-selector'
import { updateProfileData } from '../services/backend'
import { startSignIn } from '../tasks/profile'
import { _loginWithCookie } from '../steps/login'

export const handleCookies = async (browser, account) => {
  const page = await browser.newPage()
  await authenticateProxy(page, account.proxy)
  if (account.cookie) {
    await _loginWithCookie(page, account)
  } else {
    await startSignIn(page)
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
  console.log(cookieString)
  await updateProfileData(accountId, { cookies: cookieString })
}
