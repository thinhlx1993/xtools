import fs from 'fs'
import axios from 'axios'
import { getProfileData, updateProfileData } from '../services/backend'
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
  scrollIntoView,
  closeBlankPages,
  checkPort
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
    logger.info(`Open Browser ${profileData.username}`)
    const debuggerPort = profileData.debugger_port
    if (debuggerPort) {
      const webSocketDebuggerUrl = await checkPort(debuggerPort)
      console.log(`Found ${webSocketDebuggerUrl}`)
      if (webSocketDebuggerUrl) {
        const browser = await puppeteer.connect({
          browserWSEndpoint: webSocketDebuggerUrl
        })
        console.log('Connected to the browser')

        // Close the browser
        await browser.close()
      }

      args.push(`--remote-debugging-port=${debuggerPort}`)
    }
    if (profileData.settings.browserType === 'hideMyAcc') {
      try {
        const tz = await hideMyAcc.network(splitProxy(profileData.proxy))
        profileData = await getProfileData(profile, tz)
      } catch (error) {
        logger.error('Get proxy data error', {
          error: mapErrorConstructor(error)
        })
        if (error.response.data.message.includes('HMA')) {
          // Handle specific error (e.g., retry logic, alternate action)
          await updateProfileData(profile, { status: 'Check HMA Account' })
        } else {
          await updateProfileData(profile, { status: 'Proxy unstable' })
        }

        return [page, browser]
      }
    }

    if (profileData.proxy) {
      const proxyParts = profileData.proxy.split(':')
      if (proxyParts.length === 4) {
        proxyProtected = true
      }
      logger.info(`Add proxy ${profileData.proxy}`)
      args.push(`--proxy-server=${proxyParts[0]}:${proxyParts[1]}`)
    } else {
      await updateProfileData(profile, { status: 'Proxy not found' })
      return [page, browser]
    }

    logger.info(`Current dir: ${getAppPath('')}`)
    let hideMyAccProfileDir = getAppPath(`\\profiles\\${profile}`)
    if (profileData.settings.folderPath) {
      hideMyAccProfileDir = `${profileData.settings.folderPath}\\${profile}`
    }

    if (!fs.existsSync(hideMyAccProfileDir)) {
      fs.cpSync('C:\\Program Files\\XAutoTool\\resources\\HMAZeroProfile', hideMyAccProfileDir, {
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
      const pathToExtension =
        'C:\\Program Files\\XAutoTool\\resources\\extentions\\SupportSolvingFunCaptcha'
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
    let pages = await browser.pages()

    // Check if there are pages open
    logger.info(`Page length: ${pages.length}`)
    if (pages.length > 1) {
      // Iterate through all pages except the first one
      for (let i = 1; i < pages.length; i++) {
        await pages[i].close() // Close each page
      }
    }

    // At this point, only the first page is open
    // You can access the first page with pages[0] if it exists, or create a new one
    pages = await browser.pages()
    if (pages.length) {
      page = pages[0]
    } else {
      page = await browser.newPage()
    }

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

      await page.goto('https://ipfighter.com/', { waitUntil: 'networkidle0' })
      logger.info('Open the browser successfully')
      await startSignIn(profile, page)
    } catch (error) {
      logger.error(error)
      throw error
    }

    return [page, browser]
  } catch (error) {
    if (error.message.includes('net::ERR_TUNNEL_CONNECTION_FAILED')) {
      logger.error('Tunnel connection failed. Check your proxy configuration.')
      // Handle specific error (e.g., retry logic, alternate action)
      await updateProfileData(profile, { status: 'Proxy connection failed' })
    } else if (error.message.includes('net::ERR_CONNECTION_RESET')) {
      logger.error('Tunnel connection failed. Check your proxy configuration.')
      // Handle specific error (e.g., retry logic, alternate action)
      await updateProfileData(profile, { status: 'Proxy connection failed' })
    } else if (error.message.includes('HMA')) {
      // Handle specific error (e.g., retry logic, alternate action)
      await updateProfileData(profile, { status: 'Check HMA Account' })
    } else {
      logger.error(`Error occurred when open profiles:[${profile}] ${error}`)
      // Handle other types of errors
      throw error
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
  // await randomDelay()
  // try {
  //   // aria-label="Home timeline"
  //   await page.waitForSelector('div[aria-label="Home timeline"]', {
  //     visible: true,
  //     timeout: 5000
  //   })
  //   await updateProfileData(profileId, { status: 'ok' })
  //   return
  // } catch (error) {
  //   logger.info('Cant access to the homepage')
  // }

  try {
    const textExists = await page.evaluate(() =>
      document
        .querySelector('span')
        ?.innerText?.includes('Hmm...this page doesn’t exist. Try searching for something else.')
    )
    if (!textExists) {
      return
    }

    await updateProfileData(profileId, { status: 'found captcha' })

    let profileData = await getProfileData(profileId, {})
    let key = ''
    if (profileData.settings.capguruKey) {
      key = profileData.settings.capguruKey
    } else {
      await updateProfileData(profileId, { status: 'not found guru key' })
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
    const captchaResolved = await page.evaluate(() =>
      document
        .querySelector('div')
        ?.innerText?.includes("You've proven you're a human. Continue your action.")
    )
    if (captchaResolved) {
      await updateProfileData(profileId, { status: 'captcha resolved' })
    }
  } catch (error) {
    logger.error(error)
  }
}

export const startSignIn = async (profileId, page) => {
  try {
    let profileData = await getProfileData(profileId, {})
    if (profileData.cookies) {
      await setCookies(page, profileData)
      await updateProfileData(profileId, { status: 'set cookies ok' })
      // return
    }
    // Start Puppeteer
    // await updateProfileData(profileId, { status: 'logging in' })

    await page.goto('https://twitter.com')

    // check if profile is already logged in
    try {
      // await page.waitForSelector('div[aria-label="Home timeline"]', {
      //   visible: true,
      //   timeout: 10000
      // })
      // badge_count.json
      const badgeCount = await page.waitForResponse(
        (response) => response.url().includes('badge_count.json') && response.status() === 200
      )
      if (badgeCount.ok()) {
        await cacheCookies(page, profileId)
        await updateProfileData(profileId, { status: 'Login ok' })
        return
      } else {
        await updateProfileData(profileId, { status: 'logging in' })
      }
    } catch (error) {
      logger.info('Not found home page')
    }

    try {
      const acceptAllCookies =
        "//div[@role='button']/div[@dir='ltr']/span/span[contains(text(), 'Accept all cookies')]"
      await page.waitForXPath(acceptAllCookies, { timeout: 2000 })
      const nextButtons = await page.$x(acceptAllCookies)
      await nextButtons[0].click()
    } catch (error) {
      logger.info(`Not found accept cookies`)
    }

    await page.waitForSelector('a[href="/login"][data-testid="loginButton"]')
    await page.click('a[href="/login"][data-testid="loginButton"]')
    await randomDelay()

    try {
      const profileErrorText = await page.evaluate(() =>
        document
          .querySelector('span')
          ?.innerText?.includes('Oops, something went wrong. Please try again later.')
      )
      if (profileErrorText) {
        await updateProfileData(profileId, { status: 'something went wrong' })
        return
      }
      // Oops, something went wrong. Please try again later.
    } catch (error) {}
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
      return
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
    const badgeCount = await page.waitForResponse(
      (response) => response.url().includes('badge_count.json') && response.status() === 200
    )
    if (badgeCount.ok()) {
      await cacheCookies(page, profileId)
      await updateProfileData(profileId, { status: 'Login ok' })
      return
    } else {
      await updateProfileData(profileId, { status: 'Login error' })
    }
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
  await cacheCookies(page, profileId)
  await randomDelay()
}

export const checkProfiles = async (profileId, page) => {
  logger.info('checkProfiles')
  const profileData = await getProfileData(profileId, {})
  const profileInfo = profileData.profile_data ? profileData.profile_data : {}
  await page.goto(`https://twitter.com/${profileData.username}`)

  const userResponsePromise = page.waitForResponse(
    (response) => response.url().includes('UserByScreenName') && response.status() === 200
  )
  const tweetsResponsePromise = page.waitForResponse(
    (response) => response.url().includes('UserTweets') && response.status() === 200
  )

  const userResponse = await userResponsePromise
  const tweetsResponse = await tweetsResponsePromise

  // Assuming extractTwitterData and extractTweetData are asynchronous, add await if necessary.
  const twitterData = extractTwitterData(await userResponse.json())
  const tweetData = extractTweetData(await tweetsResponse.json(), profileData.username)

  logger.info(`twitterData ${JSON.stringify(twitterData)}`)
  profileInfo.verify = twitterData.isBlueVerified
  profileInfo.followers = twitterData.followersCount
  profileInfo.suspended = twitterData.hasSuspended
  profileInfo.phone_require = twitterData.needsPhoneVerification

  if (tweetData.length > 0) {
    const totalViews = sumViewCounts(tweetData)
    profileInfo.view = totalViews
    logger.info('Total Views:', totalViews)
  }
  await randomDelay()

  // check momentizable
  await page.goto('https://twitter.com/settings/monetization')
  const response = await page.waitForResponse(
    (response) =>
      response.url().includes('MonetizationCreatorSettingsQuery') && response.status() === 200
  )

  const responseData = await response.json()

  const result = responseData.data.viewer.user_results.result

  try {
    if (
      !profileInfo.verify &&
      !result.verified_program_eligibility.ad_revenue_sharing_eligibility.includes('verified')
    ) {
      profileInfo.verify = true
    }
  } catch (error) {
    logger.error(error)
  }

  if (result?.stripe_connect_account?.status === 'NotStarted') {
    logger.info(`account is ready for turn on momentization`)
    profileInfo.stripe_connect_account = false
    profileInfo.monetizable = false
    if (result?.verified_program_eligibility?.ad_revenue_sharing_eligibility?.length === 0) {
      profileInfo.account_status = 'AdsEligible'
    } else {
      profileInfo.account_status = 'NotStarted'
    }
  }

  if (
    result?.stripe_connect_account?.status === 'Completed' &&
    result?.verified_user_profiles?.ad_revenue_sharing_user_profile?.is_active === true
  ) {
    profileInfo.monetizable = true
    profileInfo.stripe_connect_account = true
    profileInfo.account_status = 'OK'
    logger.info(`ad_revenue_sharing ok`)
  }

  if (
    result?.stripe_connect_account?.status === 'Completed' &&
    result?.verified_user_profiles?.ad_revenue_sharing_user_profile?.is_active === false
  ) {
    profileInfo.monetizable = false
    profileInfo.account_status = 'ERROR'
    profileInfo.stripe_connect_account = true
    logger.info(`ad_revenue_sharing turn off`)
  }

  if (profileInfo.monetizable) {
    try {
      await randomDelay()
      await page.goto('https://twitter.com/settings/ad_rev_share_dashboard')
      const adsResponse = await page.waitForResponse(
        (response) =>
          response.url().includes('AdRevShareDashboardScreenQuery') && response.status() === 200
      )
      const adsResponseData = await adsResponse.json()
      logger.info(`${JSON.stringify(adsResponseData)}`)
      const itemsPayouts =
        adsResponseData?.data?.viewer?.user_results?.result?.ad_revenue_sharing_payouts?.items

      const tempPayouts = []
      for (let item of itemsPayouts) {
        tempPayouts.push(item.payout_amount)
      }
      profileInfo.payouts = tempPayouts
      logger.info(`payouts ${profileInfo.payouts}`)
    } catch (error) {}
  }

  // check analytics
  try {
    await randomDelay()
    await page.goto('https://twitter.com/i/account_analytics')
    const analyticsResponse = await page.waitForResponse(
      (response) => response.url().includes('AccountAnalyticsQuery') && response.status() === 200
    )
    const analyticsResponseData = await analyticsResponse.json()
    logger.info(`analyticsResponseData ${JSON.stringify(analyticsResponseData)}`)
    const currentMetrics = analyticsResponseData?.data?.user?.result?.current_organic_metrics
    profileInfo.metrics = {}
    for (let metric of currentMetrics) {
      if (metric.metric_value !== undefined) {
        // Check if metric_value is present
        profileInfo.metrics[metric.metric_type] = metric.metric_value
      }
    }
    if (!profileInfo.verify && analyticsResponseData?.data?.user?.result?.is_blue_verified) {
      profileInfo.verify = true
    }
  } catch (error) {
    logger.error(error)
  }

  logger.info(`profile info: ${JSON.stringify(profileInfo)}`)
  await updateProfileData(profileId, { profile_data: profileInfo })
}

const extractTwitterData = (responseData) => {
  const userData = responseData.data.user.result
  if (userData.reason == 'Suspended') {
    return {
      isBlueVerified: false,
      followersCount: 0,
      needsPhoneVerification: true,
      hasSuspended: true
    }
  }

  const legacyData = userData.legacy

  const isBlueVerified = userData.is_blue_verified
  const followersCount = legacyData.followers_count
  const needsPhoneVerification = legacyData.needs_phone_verification

  return {
    isBlueVerified,
    followersCount,
    needsPhoneVerification,
    hasSuspended: false
  }
}

const extractTweetData = (jsonData, username) => {
  const tweetsData = jsonData.data.user.result.timeline_v2.timeline.instructions
  let extractedData = []

  for (const instruction of tweetsData) {
    if (
      instruction.type === 'TimelinePinEntry' &&
      instruction.entry.content?.itemContent?.itemType === 'TimelineTweet'
    ) {
      const tweetData = instruction.entry.content.itemContent.tweet_results.result
      const tweetDetails = extractDetailsFromTweet(tweetData, username)
      if (tweetDetails) {
        extractedData.push(tweetDetails)
      }
    } else if (instruction.type === 'TimelineAddEntries') {
      for (const entry of instruction.entries) {
        if (entry.content?.itemContent?.itemType === 'TimelineTweet') {
          const tweetData = entry.content.itemContent.tweet_results.result
          const tweetDetails = extractDetailsFromTweet(tweetData, username)
          if (tweetDetails) {
            extractedData.push(tweetDetails)
          }
        }
      }
    }
  }

  return extractedData
}

const extractDetailsFromTweet = (tweetData, username) => {
  if (!tweetData || !tweetData.legacy) {
    return null
  }

  const legacyData = tweetData.legacy

  const retweetCount = legacyData.retweet_count
  const viewCount = tweetData?.views?.count ? tweetData.views.count : 0 // Views might not be available
  const replyCount = legacyData.reply_count ? legacyData.reply_count : 0
  const conversationId = legacyData.conversation_id_str

  const tweetUrl = `https://twitter.com/${username}/status/${conversationId}; `

  return {
    tweetUrl,
    retweetCount,
    viewCount,
    replyCount
  }
}

const sumViewCounts = (tweetDetails) => {
  let totalViewCount = 0

  for (const tweet of tweetDetails) {
    // Check if viewCount is a number or can be converted to one
    if (!isNaN(tweet.viewCount)) {
      totalViewCount += parseInt(tweet.viewCount, 10)
    }
  }

  return totalViewCount
}
