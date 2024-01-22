import fs from 'fs'
import { getProfileData, updateProfileData } from '../services/backend'
import { defaultPuppeteerOptions } from '../../constants'
import puppeteer from 'puppeteer-core'
import { getAppPath } from '../../utils'
import { splitProxy } from '../../helpers'
import hideMyAcc from '../../integration/hidemyacc'
import { randomDelay, getOtp } from './utils'
import { cacheCookies } from './cookies'
import { DOMAIN_COOKIE } from '../constants'

export const openProfileBrowser = async (profileId) => {
  try {
    let proxyProtected = false
    let args = []
    let profileData = await getProfileData(profileId, {})

    if (profileData.settings.browserType === 'hideMyAcc') {
      console.info(`get data from proxy ${profileData.proxy}`)
      const [tz] = await Promise.all([hideMyAcc.network(splitProxy(profileData.proxy))])
      console.info(`get data from tz ${tz}`)
      profileData = await getProfileData(profileId, tz)
    }

    if (profileData.proxy) {
      const proxyParts = profileData.proxy.split(':')
      if (proxyParts.length === 4) {
        proxyProtected = true
      }
      args.push(`--proxy-server=${proxyParts[0]}:${proxyParts[1]}`)
    }

    let hideMyAccProfileDir = getAppPath(`\\profiles\\${profileId}`)
    if (profileData.settings.folderPath) {
      hideMyAccProfileDir = `${profileData.settings.folderPath}\\${profileId}`
    }
    if (!fs.existsSync(hideMyAccProfileDir)) {
      fs.cpSync(getAppPath(`\\HMAZeroProfile`), hideMyAccProfileDir, {
        recursive: true
      })
    }

    args.push(`--user-data-dir=${hideMyAccProfileDir}`)
    if (profileData.browser_data) {
      args.push(`--hidemyacc-data=${profileData.browser_data}`)
    }
    // loading 2captcha plugin
    const pathToExtension = getAppPath(`\\captcha-solve`)
    if (fs.existsSync(pathToExtension)) {
      console.log(`Found extention: ${pathToExtension}`)
      // puppeteer.use(StealthPlugin())
      args.push(`--disable-extensions-except=${pathToExtension}`)
      args.push(`--load-extension=${pathToExtension}`)
      // args.push(`--disable-site-isolation-trials --remote-debugging-port=9090`)
    }
    const newBrowserOptions = {
      ...defaultPuppeteerOptions,
      executablePath: profileData.settings.browserPath,
      args: [...defaultPuppeteerOptions.args, ...args]
    }
    console.log(newBrowserOptions.args)
    const browser = await puppeteer.launch(newBrowserOptions)
    const page = await browser.newPage()

    // enter proxy username password
    if (profileData.proxy && proxyProtected) {
      const proxyParts = profileData.proxy.split(':')
      // Set up authentication for the proxy
      await page.authenticate({
        username: proxyParts[2], // Replace with your proxy username
        password: proxyParts[3] // Replace with your proxy password
      })
    }
    await page.goto('https://ipfighter.com/')
    console.info('Open the browser successfully')
    // const signinStatus = await startSignIn(profileData, browser)
    // await updateProfileData(profile, { status: signinStatus })
    // await _testCaptcha(page)
    // if (profileData.cookies) {
    //   await setCookies(page, profileData)
    // }
    return browser
  } catch (error) {
    if (error.message.includes('net::ERR_TUNNEL_CONNECTION_FAILED')) {
      console.error('Tunnel connection failed. Check your proxy configuration.')
      // Handle specific error (e.g., retry logic, alternate action)
      await updateProfileData(profileId, { status: 'proxy failed' })
    } else {
      console.error('Error occurred:', error.message)
      // Handle other types of errors
    }
  }
}

/**
 * @param {puppeteer.Page} page Puppeteer page
 * @param {{
 *   screenName: string;
 *   cookie: string;
 *   proxy: string;
 * }} account Account
 */
export const setCookies = async (page, profileData) => {
  const cookieObj = profileData.cookies
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
}

const _testCaptcha = async (page) => {
  // переходим по указанному адресу
  await page.goto('https://2captcha.com/demo/recaptcha-v2')

  // ждем пока появится элемент с CSS селектором ".captcha-solver"
  await page.waitForSelector('.captcha-solver')
  // кликаем по элементу с указанным селектором
  await page.click('.captcha-solver')

  // По умолчанию waitForSelector ожидает в течении 30 секунд, так как этого времени зачастую не достаточно, то указываем значение timeout вручную вторым параметром.
  // Значение timeout указывается в "ms".
  await page.waitForSelector(`.captcha-solver[data-state="solved"]`, { timeout: 150000 })

  // После решения капчи выполняем необходимые действия, в нашем случае нажимаем на кнопку  "check".
  await page.click("button[type='submit']")
}

export const startSignIn = async (profileId) => {
  try {
    let profileData = await getProfileData(profileId, {})
    const browser = await openProfileBrowser(profileId)
    // Start Puppeteer
    await updateProfileData(profileId, { status: 'logging in' })
    const page = await browser.newPage()

    await page.goto('https://twitter.com')
    await randomDelay()
    await page.waitForSelector('a[href="/login"][data-testid="loginButton"]')
    await page.click('a[href="/login"][data-testid="loginButton"]')
    await randomDelay()
    await page.waitForSelector('div[dir="ltr"] > input[autocomplete="username"]')
    // Replace sendDelays with typing with delay
    await page.type('div[dir="ltr"] > input[autocomplete="username"]', profileData.username, {
      delay: 100
    })
    await randomDelay()
    await page.waitForSelector('div[role="button"] > div[dir="ltr"] > span > span')
    const nextButtonXPath =
      "//div[@role='button']/div[@dir='ltr']/span/span[contains(text(), 'Next')]"
    await page.waitForXPath(nextButtonXPath)
    const nextButtons = await page.$x(nextButtonXPath)
    if (nextButtons.length === 0) {
      throw new Error('Login error, Next button not found exception')
    }
    await nextButtons[0].click()
    await randomDelay()
    await page.waitForSelector('div[dir="ltr"] > input[autocomplete="current-password"]')
    await page.type(
      'div[dir="ltr"] > input[autocomplete="current-password"]',
      profileData.password,
      {
        delay: 100
      }
    )
    await randomDelay()
    await page.waitForSelector('div[role="button"][data-testid="LoginForm_Login_Button"]')
    await page.click('div[role="button"][data-testid="LoginForm_Login_Button"]')
    await randomDelay()
    await page.waitForSelector('input[data-testid="ocfEnterTextTextInput"]')

    const currentOtp = getOtp(profileData.fa)
    console.log(profileData.fa)
    await randomDelay()
    await page.type('input[data-testid="ocfEnterTextTextInput"]', currentOtp, { delay: 100 })
    await randomDelay()
    await page.waitForSelector('div[role="button"][data-testid="ocfEnterTextNextButton"]')
    await page.click('div[role="button"][data-testid="ocfEnterTextNextButton"]')
    await randomDelay()
    // Close Puppeteer
    await browser.close()
    await updateProfileData(profileId, { status: 'logged' })
  } catch (error) {
    await updateProfileData(profileId, { status: 'login failed' })
  }
}

export const getCookies = async (profileId) => {
  const browser = await openProfileBrowser(profileId)
  await randomDelay()
  await cacheCookies(browser, profileId)
  await randomDelay()
  await browser.close()
}
