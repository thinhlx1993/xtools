import fs from 'fs'
import axios from 'axios'
import { getProfileData, updateProfileData } from '../services/backend'
import { defaultPuppeteerOptions } from '../../constants'
import puppeteer from 'puppeteer-extra'
import { getAppPath } from '../../utils'
import { splitProxy } from '../../helpers'
import hideMyAcc from '../../integration/hidemyacc'
import {
  randomDelay,
  getOtp,
  accessToIframe,
  clickIntoNext,
  calculateClicks,
  sendCapGuruRequest
} from './utils'
import { cacheCookies } from './cookies'
import { DOMAIN_COOKIE } from '../constants'

export const openProfileBrowser = async (profile) => {
  try {
    let proxyProtected = false
    let args = []
    console.log(profile)
    let profileData = await getProfileData(profile, {})
    if (profileData.settings.browserType === 'hideMyAcc') {
      console.info(`get data from proxy ${profileData.proxy}`)
      const [tz] = await Promise.all([hideMyAcc.network(splitProxy(profileData.proxy))])
      console.info(`get data from tz ${tz}`)
      profileData = await getProfileData(profile, tz)
    }

    if (profileData.proxy) {
      const proxyParts = profileData.proxy.split(':')
      if (proxyParts.length === 4) {
        proxyProtected = true
      }
      args.push(`--proxy-server=${proxyParts[0]}:${proxyParts[1]}`)
    }

    let hideMyAccProfileDir = getAppPath(`\\profiles\\${profile}`)
    if (profileData.settings.folderPath) {
      hideMyAccProfileDir = `${profileData.settings.folderPath}\\${profile}`
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

    try {
      // loading 2captcha plugin
      const pathToExtension = getAppPath(`\\extentions\\SupportSolvingFunCaptcha`)
      if (fs.existsSync(pathToExtension)) {
        console.log(`Found extention: ${pathToExtension}`)
        // puppeteer.use(StealthPlugin())
        args.push(`--disable-extensions-except=${pathToExtension}`)
        args.push(`--load-extension=${pathToExtension}`)
        args.push(`--remote-debugging-port=9090`)
      }
    } catch (error) {
      console.log(error)
    }
    const newBrowserOptions = {
      ...defaultPuppeteerOptions,
      executablePath: profileData.settings.browserPath,
      args: [...defaultPuppeteerOptions.args, ...args]
    }
    // console.log(newBrowserOptions.args)
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
    // await startSignIn(profile, browser) // test signin
    // await updateProfileData(profile, { status: signinStatus })
    // await resolveCaptcha(profile, page)
    // if (profileData.cookies) {
    //   await setCookies(page, profileData)
    // }
    return browser
  } catch (error) {
    if (error.message.includes('net::ERR_TUNNEL_CONNECTION_FAILED')) {
      console.error('Tunnel connection failed. Check your proxy configuration.')
      // Handle specific error (e.g., retry logic, alternate action)
      await updateProfileData(profile, { status: 'proxy failed' })
      return null
    } else {
      console.error('Error occurred:', error.message)
      return null
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

export const resolveCaptcha = async (profileId, browser) => {
  var page = await browser.newPage()
  await page.goto('https://twitter.com/')
  await randomDelay()
  try {
    // aria-label="Home timeline"
    await page.waitForSelector('div[aria-label="Home timeline"]', {
      visible: true,
      timeout: 10000
    })
    await updateProfileData(profileId, { status: 'ok' })
    return
  } catch (error) {
    console.log('Cant access to the homepage')
  }

  await page.evaluate(() =>
    document
      .querySelector('span')
      ?.innerText?.includes('Hmm...this page doesn’t exist. Try searching for something else.')
  )
  await updateProfileData(profileId, { status: 'found captcha' })

  try {
    let profileData = await getProfileData(profileId, {})
    let key = ''
    if (profileData.settings.capguruKey) {
      key = profileData.settings.capguruKey
    } else {
      await updateProfileData(profileId, { status: 'captcha|not found guru key' })
      return
    }

    if (await page.$('a[href="/search"')) await page.click('a[href="/search"')

    await randomDelay()
    await page.waitForSelector('iframe[id="arkose_iframe"]', {
      visible: true,
      timeout: 10000
    })
    console.log('ok found iframe')
    await randomDelay(10000, 20000)
    // Access the first level iframe
    const firstLevelFrame = await accessToIframe(page, 'iframe')

    // Access the second level iframe
    const secondLevelFrame = await accessToIframe(firstLevelFrame, 'iframe')

    // Access the third level iframe
    const thirdLevelFrame = await accessToIframe(secondLevelFrame, 'iframe')
    console.log('ok found iframe 3')
    const buttonSelector = 'button[data-theme="home.verifyButton"]' // Replace with the selector for your button
    await thirdLevelFrame.waitForSelector(buttonSelector)
    await thirdLevelFrame.click(buttonSelector) // click into authentication button
    await randomDelay()

    const challegingText = await thirdLevelFrame.$eval(
      'div > div > h2 > span[role="text"]',
      (element) => element.textContent
    )

    console.log(challegingText)

    const regexTaks = /\((\d+) of (\d+)\)/ // Regex pattern to match and capture numbers in the format (X of Y)

    const matchTaks = challegingText.match(regexTaks)
    let number1, number2

    if (matchTaks) {
      number1 = matchTaks[1] // First captured group (number before "of")
      number2 = matchTaks[2] // Second captured group (number after "of")
    }

    for (let i = 0; i < number2; i++) {
      await page.waitForSelector('#Base64ImageCaptcha')
      // Get the value of the input element
      const captchaBase64 = await page.evaluate(() => {
        const inputElement = document.getElementById('Base64ImageCaptcha')
        return inputElement ? inputElement.value : null
      })
      // console.log(captchaBase64)
      // Split the string at the comma
      const base64Data = captchaBase64.split(',')[1]

      // Prepare payload for CAPTCHA solving service
      const payload = {
        textinstructions: challegingText,
        click: 'funcap',
        key: key,
        method: 'base64',
        body: base64Data
      }

      // Send CAPTCHA to the solving service
      const captchaResponse = await sendCapGuruRequest(payload)

      // Wait for a while before retrieving the solution
      await randomDelay(15000, 20000)

      // Retrieve the solution
      const rt = captchaResponse.split('|')
      console.log(rt)
      const solutionUrl = `http://api.cap.guru/res.php?key=${key}&id=${rt[1]}`
      console.log(solutionUrl)
      const solutionResponse = await axios.get(solutionUrl)
      console.log(solutionResponse.data)
      if (solutionResponse.data === 'ERROR_CAPTCHA_UNSOLVABLE') {
        await updateProfileData(profileId, { status: 'ERROR_CAPTCHA_UNSOLVABLE' })
        return
      }
      // Regular expression to match the pattern "x=number"
      const regex = /x=(\d+)/
      const match = solutionResponse.data.match(regex)

      let xValue = null
      if (match) {
        xValue = parseInt(match[1], 10) // Convert the captured group to an integer
        console.log(xValue)
        const numberOfClicks = await calculateClicks(xValue)
        console.log(`Number clicks ${numberOfClicks}`)
        await clickIntoNext(thirdLevelFrame, numberOfClicks)
        await randomDelay()
        // Function to click a button based on its text content
        await thirdLevelFrame.evaluate(() => {
          // Find all buttons on the page
          const buttons = Array.from(document.querySelectorAll('button'))
          // Find the button with the text 'Submit'
          const submitButton = buttons.find((button) => button.textContent === 'Submit')
          // Click the button if found
          if (submitButton) {
            submitButton.click()
          }
        })
        await randomDelay(5000, 10000)
      }
    }
    await updateProfileData(profileId, { status: 'ok' })
  } catch (error) {
    console.log(error)
    await updateProfileData(profileId, { status: 'captcha error' })
  }
}

export const startSignIn = async (profileId, browser) => {
  try {
    let profileData = await getProfileData(profileId, {})
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
      await updateProfileData(profileId, { status: 'Login error' })
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
    await updateProfileData(profileId, { status: 'ok' })
  } catch (error) {
    await updateProfileData(profileId, { status: 'login failed' })
  }
}

export const getCookies = async (profileId, browser) => {
  await randomDelay()
  await cacheCookies(browser, profileId)
  await randomDelay()
}
