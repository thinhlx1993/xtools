import puppeteer from 'puppeteer-core'
import { DOMAIN_COOKIE, PAGE_URL } from '../constants'
import { regHomePageUrl, regGraphAPIHomeTimeline, regGraphAPIDataSaverMode } from '../regex'
import utils from '../utils'
import { authenticateProxy, testRegHttpEvent } from '../helpers'
import repository from '../../database/repository'
import { loginPathSelector } from '../path-selector'
import { updateProfileData } from '../services/backend'
/**
 *
 * @param {puppeteer.Page} page
 * @param {number} accountId
 */
const _cacheCookies = async (page, accountId) => {
  const cookies = await page.cookies()
  const cookieString = cookies.reduce((result, cookie) => {
    if (['.twitter.com', 'twitter.com'].includes(cookie.domain)) {
      result += `${cookie.name}=${cookie.value};`
    }
    return result
  }, '')
  const account = await repository.findOneAccount(accountId)
  await updateProfileData(account.profileId, { cookies: cookieString })
  await repository.updateAccount({ id: accountId }, { cookie: cookieString })
  console.log('submit cookies ok')
}

/**
 *
 * @param {puppeteer.Page} page
 */
const _handleUseCookie = async (page) => {
  const buttons = await page.$$(loginPathSelector.layerBottomBarUseCookieBtn)
  if (buttons.length === 2) {
    return await buttons[0].click()
  }
  // logging
}

/**
 * @param {puppeteer.Page} page Puppeteer page
 * @param {{
 *   screenName: string;
 *   cookie: string;
 *   proxy: string;
 * }} account Account
 */
export const _loginWithCookie = async (page, account) => {
  const cookieObj = account.cookie
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
    .catch((error) => {})
  await utils.delay()
  if (!regHomePageUrl.test(page.url())) {
    throw new Error('Cookie has some problem')
  }
  return page
}

/**
 *
 * @param {puppeteer.Page} page
 */
const _handleLoginLoginManually = async (page) => {
  await page.goto(PAGE_URL.login)
  await new Promise((resolve) => {
    page.on('response', (response) => {
      if (
        (testRegHttpEvent(regGraphAPIDataSaverMode, response) ||
          testRegHttpEvent(regGraphAPIHomeTimeline, response)) &&
        response.status() === 200
      ) {
        return
      }
      return resolve()
    })
  })
  return page
}

// const _loginWithUsernameAndPassword = () => {
//   // console.log("startLogin");
//   // // login with cached auth session
//   // if (await _cachingAuthSession(browser)) {
//   //   console.log("loginWithCookiesSuccess");
//   //   return;
//   // }
//   // // get account
//   // const accountTxt = getInputFile(INPUT_FILE_NAME.account);
//   // const accountParts = accountTxt.split("|");
//   // const username = accountParts[0];
//   // const password = accountParts[1];
//   // // start login
//   // const page = await browser.newPage();
//   // await page.goto(PAGE_URL.login);
//   // // enter username
//   // try {
//   //   await page.waitForSelector(loginPathSelector.usernameInput, {
//   //     visible: true,
//   //     timeout: 5000,
//   //   });
//   // } catch (error) {
//   //   console.error("LOGIN_STEP_WAIT_USERNAME_INPUT_ERROR", error);
//   // }
//   // await page.click(loginPathSelector.usernameInput);
//   // await page.keyboard.sendCharacter(username);
//   // const allBtnInNext = await page.$$(loginPathSelector.btn);
//   // const btnNextTexts = await Promise.all(
//   //   allBtnInNext.map((element) =>
//   //     element.$eval("span", (span) => span.textContent)
//   //   )
//   // );
//   // const nextBtnIndex = btnNextTexts.indexOf("Next");
//   // const nextBtn = allBtnInNext[nextBtnIndex];
//   // if (!nextBtn) {
//   //   console.error("LOGIN_STEP_NEXT_BTN_NOT_FOUND");
//   //   throw new Error("Login in username have error");
//   // }
//   // nextBtn.click();
//   // // enter password
//   // try {
//   //   await page.waitForSelector(loginPathSelector.passwordInput, {
//   //     visible: true,
//   //     timeout: 5000,
//   //   });
//   // } catch (error) {
//   //   console.error("LOGIN_STEP_WAIT_PASSWORD_INPUT_ERROR", error);
//   // }
//   // await page.click(loginPathSelector.passwordInput);
//   // await page.keyboard.sendCharacter(password);
//   // const allBtnInLogIn = await page.$$(loginPathSelector.btn);
//   // const btnLoginTexts = await Promise.all(
//   //   allBtnInLogIn.map((element) =>
//   //     element.$eval("span", (span) => span.textContent)
//   //   )
//   // );
//   // const loginInBtnIndex = btnLoginTexts.indexOf("Log in");
//   // const loginBtn = allBtnInLogIn[loginInBtnIndex];
//   // if (!loginBtn) {
//   //   console.error("LOGIN_STEP_LOGIN_BTN_NOT_FOUND");
//   //   throw new Error("Login in password have error");
//   // }
//   // loginBtn.click();
//   // await page.waitForNavigation();
//   // // cache auth session
//   // _cacheAuthSession(page);
//   // await page.close();
//   // console.log("loginSuccess");
// }

/**
 * @param {puppeteer.Browser} browser Puppeteer browser
 * @param {{
 *  id: number
 *  screenName: string;
 *  cookie: string;
 *  proxy: string;
 * }} account Account
 */
export default async (browser, account) => {
  const page = await browser.newPage()
  await authenticateProxy(page, account.proxy)
  if (account.cookie) {
    await _loginWithCookie(page, account)
  } else {
    await _handleLoginLoginManually(page)
  }
  await _handleUseCookie(page)
  await _cacheCookies(page, account.id)
  return page
}
