import fs from 'fs'
import axios from 'axios'
import { getProfileData, updateProfileData, updatePostData } from '../services/backend'
import { defaultPuppeteerOptions, getRandomPosition } from '../../constants'
import puppeteer from 'puppeteer-extra'
import { getAppPath } from '../../utils'
import { splitProxy, mapErrorConstructor } from '../../helpers'
import hideMyAcc from '../../integration/hidemyacc'

import {
  randomDelay,
  getOtp,
  accessToIframe,
  clickIntoNext,
  calculateClicks,
  sendCapGuruRequest,
  scrollIntoView
} from './utils'
import { cacheCookies } from './cookies'
import { DOMAIN_COOKIE } from '../constants'
import logger from '../../logger'

export const openProfileBrowser = async (profile) => {
  let browser = null
  let page = null
  try {
    let proxyProtected = false
    const randomPos = getRandomPosition()
    let args = [`--window-position=${randomPos}`]
    let profileData = await getProfileData(profile, {})
    const debuggerPort = profileData.debugger_port
    if (debuggerPort) {
      args.push(`--remote-debugging-port=0`)
    }
    if (profileData.settings.browserType === 'hideMyAcc') {
      try {
        const tz = await hideMyAcc.network(splitProxy(profileData.proxy))
        profileData = await getProfileData(profile, tz)
      } catch (error) {
        logger.error('Get proxy data error', {
          error: mapErrorConstructor(error)
        })
        await updateProfileData(profile, { status: 'Proxy error' })
        return [page, browser]
      }
    }

    if (profileData.proxy) {
      const proxyParts = profileData.proxy.split(':')
      if (proxyParts.length === 4) {
        proxyProtected = true
      }
      logger.info(`Add proxy`)
      args.push(`--proxy-server=${proxyParts[0]}:${proxyParts[1]}`)
    }
    logger.info(`Current dir: ${getAppPath('')}`)
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
    logger.info(`hideMyAccProfileDir: ${hideMyAccProfileDir}`)

    try {
      // loading 2captcha plugin
      const pathToExtension = getAppPath(`\\extentions\\SupportSolvingFunCaptcha`)
      if (fs.existsSync(pathToExtension)) {
        logger.info(`Found extention: ${pathToExtension}`)
        // puppeteer.use(StealthPlugin())
        args.push(`--disable-extensions-except=${pathToExtension}`)
        args.push(`--load-extension=${pathToExtension}`)
      }
    } catch (error) {
      logger.error('Load extentions error', {
        error: mapErrorConstructor(error)
      })
    }
    const newBrowserOptions = {
      ...defaultPuppeteerOptions,
      executablePath: profileData.settings.browserPath,
      args: [...defaultPuppeteerOptions.args, ...args]
    }
    // logger.info(newBrowserOptions.args)
    browser = await puppeteer.launch(newBrowserOptions)
    page = await browser.newPage()

    try {
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
      logger.info('Open the browser successfully')
      await randomDelay()
      await startSignIn(profile, page)
    } catch (error) {}

    return [page, browser]
  } catch (error) {
    if (error.message.includes('net::ERR_TUNNEL_CONNECTION_FAILED')) {
      logger.error('Tunnel connection failed. Check your proxy configuration.')
      // Handle specific error (e.g., retry logic, alternate action)
      await updateProfileData(profile, { status: 'proxy failed' })
    } else {
      logger.error(`Error occurred when open profiles:[${profile}] ${error}`)
      // Handle other types of errors
    }
    return [page, browser]
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

export const resolveCaptcha = async (profileId, page) => {
  await randomDelay()
  try {
    // aria-label="Home timeline"
    await page.waitForSelector('div[aria-label="Home timeline"]', {
      visible: true,
      timeout: 5000
    })
    await updateProfileData(profileId, { status: 'ok' })
    return
  } catch (error) {
    logger.info('Cant access to the homepage')
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

    await randomDelay(5000, 10000)
    await page.waitForSelector('iframe[id="arkose_iframe"]', {
      visible: true,
      timeout: 2000
    })
    logger.info('ok found iframe')
    // Access the first level iframe
    const firstLevelFrame = await accessToIframe(page, 'iframe')
    // Access the second level iframe
    const secondLevelFrame = await accessToIframe(firstLevelFrame, 'iframe')
    // Access the third level iframe
    const thirdLevelFrame = await accessToIframe(secondLevelFrame, 'iframe')
    logger.info('ok found iframe 3')
    await randomDelay()
    const buttonSelector = 'button[data-theme="home.verifyButton"]' // Replace with the selector for your button
    await thirdLevelFrame.waitForSelector(buttonSelector)
    await thirdLevelFrame.click(buttonSelector) // click into authentication button
    await randomDelay()

    const challegingText = await thirdLevelFrame.$eval(
      'div > div > h2 > span[role="text"]',
      (element) => element.textContent
    )

    logger.info(challegingText)

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
      // logger.info(captchaBase64)
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
      await randomDelay(5000, 10000)

      // Retrieve the solution
      const rt = captchaResponse.split('|')
      logger.info(rt)
      const solutionUrl = `http://api.cap.guru/res.php?key=${key}&id=${rt[1]}`
      logger.info(solutionUrl)
      const solutionResponse = await axios.get(solutionUrl)
      logger.info(solutionResponse.data)
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
        logger.info(xValue)
        const numberOfClicks = await calculateClicks(xValue)
        logger.info(`Number clicks ${numberOfClicks}`)
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
        await randomDelay(1000, 3000)
      }
    }
    // You've proven you're a human. Continue your action.
    await updateProfileData(profileId, { status: 'ok' })
  } catch (error) {
    logger.info(error)
    await updateProfileData(profileId, { status: 'captcha error' })
  }
}

export const startSignIn = async (profileId, page) => {
  try {
    let profileData = await getProfileData(profileId, {})
    if (profileData.cookies) {
      await setCookies(page, profileData)
      // for (let index = 0; index < 2; index++) {
      //   await tryAgain(page)
      //   await randomDelay()
      // }
      await updateProfileData(profileId, { status: 'set cookies ok' })
      return
    }
    // Start Puppeteer
    await updateProfileData(profileId, { status: 'logging in' })

    await page.goto('https://twitter.com')
    await randomDelay()

    // check if profile is already logged in
    try {
      await page.waitForSelector('div[aria-label="Home timeline"]', {
        visible: true,
        timeout: 2000
      })
      await cacheCookies(page, profileId)
      await updateProfileData(profileId, { status: 'ok' })
      return
    } catch (error) {
      logger.info('Not found home page')
    }

    try {
      const acceptAllCookies =
        "//div[@role='button']/div[@dir='ltr']/span/span[contains(text(), 'Accept all cookies')]"
      await page.waitForXPath(acceptAllCookies)
      const nextButtons = await page.$x(acceptAllCookies)
      await nextButtons[0].click()
    } catch (error) {
      logger.info(`Not found accept cookies`)
    }

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
    logger.info(profileData.fa)
    await randomDelay()
    await page.type('input[data-testid="ocfEnterTextTextInput"]', currentOtp, { delay: 100 })
    await randomDelay()
    await page.waitForSelector('div[role="button"][data-testid="ocfEnterTextNextButton"]')
    await page.click('div[role="button"][data-testid="ocfEnterTextNextButton"]')
    await randomDelay()
    await updateProfileData(profileId, { status: 'ok' })
    await cacheCookies(page, profileId)
    await randomDelay(5000, 15000)
  } catch (error) {
    await updateProfileData(profileId, { status: 'login failed' })
  }
}

const tryAgain = async (page) => {
  try {
    await page.evaluate(() =>
      document
        .querySelector('span')
        ?.innerText?.includes('Something went wrong, but don’t fret — let’s give it another shot.')
    )
    await page.waitForSelector('button[type="submit"]', {
      visible: true,
      timeout: 1000
    })
    await page.click('button[type="submit"]')
  } catch (error) {
    logger.error(error)
  }
}

export const getCookies = async (profileId, page) => {
  await randomDelay()
  await cacheCookies(page, profileId)
  await randomDelay()
}

export const checkProfiles = async (profileId, page) => {
  logger.info('checkProfiles')
  const profileData = await getProfileData(profileId, {})
  await page.goto('https://twitter.com')
  await randomDelay()
  await page.waitForSelector('div[aria-label="Home timeline"]', {
    visible: true,
    timeout: 5000
  })
  await page.waitForSelector('a[data-testid="AppTabBar_Profile_Link"]')
  await page.click('a[data-testid="AppTabBar_Profile_Link"]')

  await randomDelay()
  await page.waitForSelector('a[href*="/following"]', {
    visible: true,
    timeout: 5000
  })

  let followers = profileData.followers ? profileData.followers : ''
  let following = profileData.following ? profileData.following : ''
  let verify = profileData.verify ? profileData.verify : false
  let payouts = profileData.payouts ? profileData.payouts : []
  let monetizable = profileData.monetizable ? profileData.monetizable : false
  let impressions = profileData.impressions ? profileData.impressions : ''

  // Query for links that contain '/following' in their href
  try {
    let element = await page.waitForSelector('a[href*="/following"]')
    await scrollIntoView(element)
    following = await element.evaluate((el) => el.textContent, element)
    logger.info(`Following ${following}`)
  } catch (error) {
    console.error('Error in /following:', error)
  }

  try {
    let element = await page.waitForSelector('a[href*="/verified_followers"]')
    await scrollIntoView(element)
    followers = await element.evaluate((el) => el.textContent, element)
    logger.info(`Followers ${followers}`)
  } catch (error) {
    console.error('Error in /verified_followers:', error)
  }

  try {
    let element = await page.waitForSelector(
      'div[aria-label="Provides details about verified accounts."]'
    )
    await scrollIntoView(element)
    verify = element ? true : false
    logger.info(`Verify ${verify}`)
  } catch (error) {
    console.error('Error in verified accounts:', error)
  }

  await updateProfileData(profileId, { profile_data: { followers, following, verify } })

  const isSelectorPresent = (await page.$('article[data-testid="tweet"]')) !== null
  if (isSelectorPresent) {
    await page.waitForSelector('article[data-testid="tweet"]')
    const articles = await page.$$('article[data-testid="tweet"]')

    for (const article of articles) {
      try {
        let content = ''
        let tw_post_id = ''
        let view = ''
        await scrollIntoView(article)
        try {
          const element = await article.waitForSelector('div')

          if (element) {
            content = await element.evaluate((node) => node.textContent)
          }
        } catch (error) {
          logger.error(`Error processing article content: ${error}`)
        }
        try {
          const elementPost = await article.waitForSelector(
            'div > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(1) > div > div > div:nth-child(2) > div > div:nth-child(3) > a'
          )
          if (elementPost) {
            tw_post_id = await elementPost.evaluate((link) => link.href, elementPost)
          }
        } catch (error) {
          logger.error(`Error processing tw_post_id: ${error}`)
        }
        try {
          const viewElement = await article.waitForSelector(
            'div > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(3) > div > div'
          )
          if (viewElement) {
            view = await viewElement.evaluate(
              (link) => link.getAttribute('aria-label'),
              viewElement
            )
          }
        } catch (error) {
          logger.error(`Error processing view: ${error}`)
        }
        // Handling postData
        const postData = {
          content: content,
          tw_post_id: tw_post_id,
          profile_id: profileId,
          view: view
        }
        logger.info(`Post data: ${JSON.stringify(postData)}`)
        await updatePostData(profileId, postData)
      } catch (error) {
        logger.error(`Error processing article: ${error}`)
      }
    }
  }

  // check momentizable
  await page.goto('https://twitter.com/settings/monetization')
  await randomDelay()

  try {
    const adsEnable = await page.waitForSelector('a[href="/settings/ad_rev_share_dashboard"]')
    if (adsEnable) {
      monetizable = true
      logger.info('Ads Eligible')
    }
  } catch (error) {
    logger.info('Not found Not yet eligible')
  }

  if (monetizable) {
    try {
      await page.click('a[href="/settings/ad_rev_share_dashboard"]')
      // section[aria-label="Section details"] > div > div > ul > div > div > li > div
      try {
        const revenueElement = await page.waitForSelector(
          'section[aria-label="Section details"] > div > div > ul > div > div > li > div'
        )

        if (revenueElement) {
          const payout = await revenueElement.evaluate((node) => node.textContent)
          if (!payouts.includes(payout)) {
            payouts.push(payout)
          }
        }
      } catch (error) {
        logger.error(`Error processing article content: ${error}`)
      }
    } catch (error) {}
  }

  await updateProfileData(profileId, {
    profile_data: { followers, following, verify, monetizable, payouts }
  })
}
