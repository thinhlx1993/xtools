import puppeteer from 'puppeteer-core'
import fs from 'fs'
import hideMyAcc from '../integration/hidemyacc'
import { SCRIPT_STATUS, FEATURE_TYPE, BROWSER_TYPE } from '../constants'
import repository from '../database/repository'
import logger from '../logger'
import loginStep from './steps/login'
import accountInfoStep from './steps/account-info'
import followProfilesStep from './steps/follow'
import crawlPostStep from './steps/crawl-post'
import reUpStep from './steps/reup-post'
import profileAdsStep from './steps/profile-ads/index'
import fairInteractStep from './steps/fair-interact'
import buffViewsStep from './steps/buff-view'
import newsFeedStep from './steps/newsfeed'
import interactSpecializationStep from './steps/interact-specialization'
import { regTwDomain, regXDomain } from './regex'
import utils from './utils'
import { mapErrorConstructor, splitProxy } from '../helpers'
import { getAppPath } from '../utils'
// eslint-disable-next-line no-unused-vars
import { Account, ScriptOption } from './define-type'
import { openProfileBrowser } from './tasks/profile'

const WINDOWS_SIZE = {
  width: 500,
  height: 500
}

const puppeteerOptions = {
  headless: false,
  defaultViewport: {
    width: 1280,
    height: 750
  },
  args: [
    '--disable-notifications',
    '--no-sandbox',
    `--window-size=${WINDOWS_SIZE.width},${WINDOWS_SIZE.height}`
  ],
  ignoreDefaultArgs: ['--enable-automation']
}

const dataMemories = {}

// const _createWindowPositions = (bounds) => {};

/**
 *
 * @param {ScriptOption} options
 * @param {Account} account
 */
const _createOrUpdateHideMyAccBrowser = async (options, account) => {
  const currentHideMyAccUsername = options.browser.hideMyAcc.username
  const hideMyAccProfileDir = getAppPath(`/hideMyAccProfileDir/${account.id}`)
  let browserProfileName = account.browserProfileName
  let hideMyAccProfileId = account.hideMyAccProfileId
  const updatedAccount = {}
  if (currentHideMyAccUsername !== account.hideMyAccUsername) {
    browserProfileName = ''
    hideMyAccProfileId = ''
  }
  if (!fs.existsSync(hideMyAccProfileDir)) {
    fs.cpSync(getAppPath(`/HMAZeroProfile`), hideMyAccProfileDir, {
      recursive: true
    })
  }
  if (!browserProfileName) {
    browserProfileName = `Profile ${account.id}`
    updatedAccount['browserProfileName'] = browserProfileName
  }
  const token = await hideMyAcc.getToken(options.browser.hideMyAcc)
  if (!token) {
    throw new Error('INIT_CREATE_OR_UPDATE_HIDEMYACC_BROWSER_ERROR')
  }
  if (!hideMyAccProfileId) {
    const browserProfile = await hideMyAcc.createProfile(token, {
      name: browserProfileName,
      os: process.platform === 'darwin' ? 'mac' : 'win',
      browserVersion: options.browser.hideMyAcc.browserVersion
    })
    if (browserProfile.result.id) {
      hideMyAccProfileId = browserProfile.result.id
      updatedAccount['hideMyAccProfileId'] = hideMyAccProfileId
      updatedAccount['hideMyAccUsername'] = currentHideMyAccUsername
    }
  }
  if (Object.keys(updatedAccount).length) {
    await repository.updateAccount({ id: account.id }, updatedAccount)
  }
  if (!hideMyAccProfileId) {
    throw new Error('CREATE_OR_UPDATE_HIDEMYACC_BROWSER_ERROR')
  }
  const [tz] = await Promise.all([
    hideMyAcc.network(splitProxy(account.proxy)),
    account.hideMyAccProfileId &&
      hideMyAcc
        .updateProfile(token, account.hideMyAccProfileId, {
          name: account.browserProfileName
        })
        .catch((error) => {
          console.log('error', error)
        })
  ])
  const responseBrowserData = await hideMyAcc.getProfileData(token, hideMyAccProfileId, tz)
  if (!responseBrowserData.result) {
    throw new Error('GET_HIDEMYACC_BROWSER_ERROR')
  }
  return [
    '--lang=en-US --disable-encryption',
    '--flag-switches-begin',
    '--flag-switches-end',
    `--user-data-dir=${hideMyAccProfileDir}`,
    `--hidemyacc-data=${responseBrowserData.result}`
  ]
}

/**
 *
 * @param {ScriptOption} options
 * @param {Account} account
 * @param {*} index
 * @param {*} bounds
 * @returns
 */
const _createNewBrowser = async (options, account, index, bounds) => {
  const args = []
  const browserType = options.browser.browserOption
  switch (browserType) {
    case BROWSER_TYPE.hideMyAcc:
      // if (!account.hideMyAccProfileDir || !account.browserProfileName) {
      //   throw new Error("Check account setting for hideMyAcc");
      // }
      // args.push("--lang=en-US --disable-encryption");
      // args.push("--flag-switches-begin");
      // args.push("--flag-switches-end");
      // if (account.hideMyAccProfileDir) {
      //   args.push(`--user-data-dir=${account.hideMyAccProfileDir}`);
      // }
      const hideMyAccArgs = await _createOrUpdateHideMyAccBrowser(options, account)
      hideMyAccArgs.forEach((hideMyAccArg) => args.push(hideMyAccArg))
      break
    default:
      break
  }
  if (account.proxy) {
    const proxyParts = account.proxy.split(':')
    args.push(`--proxy-server=${proxyParts[0]}:${proxyParts[1]}`)
  }
  const newBrowserOptions = {
    ...puppeteerOptions,
    executablePath: options.browser[browserType].browserExecutablePath,
    args: [
      ...puppeteerOptions.args,
      ...args
      // `--window-position=${index * WINDOWS_SIZE.width},${
      //   index * WINDOWS_SIZE.height
      // }`,
    ]
  }
  return await puppeteer.launch(newBrowserOptions)
}

/**
 * check new page (is ads page)
 * @param {puppeteer.Target} target
 */
const _handleNewPage = async (target) => {
  const isTwUrl = (pageUrl) => regTwDomain.test(pageUrl) || regXDomain.test(pageUrl)
  try {
    console.log('targetcreated')
    const newPage = await target.page()
    if (!newPage) {
      return
    }
    const pageUrl = newPage.url()
    console.log('pageUrl', pageUrl)
    if (isTwUrl(pageUrl)) {
      return
    }
    try {
      await newPage.waitForNavigation({ waitUntil: 'networkidle0' })
    } catch (error) {}
    try {
      const pageUrlSecond = newPage.url()
      console.log('pageUrlSecond', pageUrlSecond)
      await utils.delayRandom([4000, 4250, 4500, 4750, 5000, 5250, 5500, 5750, 6000])
      if (isTwUrl(pageUrlSecond)) {
        return
      }
    } catch (error) {
      console.log('targetcreated__closed')
      return
    }
    await newPage.close()
  } catch (error) {
    logger.error('HAND_TARGET_CREATED_ERROR', {
      error: mapErrorConstructor(error)
    })
  }
}

/**
 *
 * @param {ScriptOption} options
 * @param {*} callbackFuncUpdateStatus
 * @param {number} accountId
 * @returns
 */
const init = async (options, callbackFuncUpdateStatus, accountId) => {
  try {
    // get account data
    const [account, features] = await Promise.all([
      repository.findOneAccount(accountId),
      repository.findFeaturesOptions(accountId)
    ])
    // get account data

    // init browser
    // const browser = await _createNewBrowser(options, account)
    // new browser here
    logger.info(`Open browser ${account.profileId}`)
    const browser = await openProfileBrowser(account.profileId)
    dataMemories[accountId] = { browser }
    callbackFuncUpdateStatus(SCRIPT_STATUS.initSuccess)
    // init browser

    browser.on('targetdestroyed', async (target) => {
      // fix listen disconnected on MacOS
      const pages = await browser.pages()
      if (!pages.length) {
        callbackFuncUpdateStatus(SCRIPT_STATUS.forceStop)
      }
    })
    browser.on('targetcreated', _handleNewPage)

    // login
    callbackFuncUpdateStatus(SCRIPT_STATUS.login)
    const page = await loginStep(browser, account).catch((error) => {
      logger.error('LOGIN_ERROR', error)
    })
    if (!page) {
      callbackFuncUpdateStatus(SCRIPT_STATUS.loginFail)
      return
    }
    callbackFuncUpdateStatus(SCRIPT_STATUS.loginSuccess)
    if (!account.profileId) {
      // get account info
      callbackFuncUpdateStatus(SCRIPT_STATUS.getAccountInfo)
      const info = await accountInfoStep(page).catch((error) => {
        logger.error('GET_ACCOUNT_INFO_ERROR', error)
        return
      })
      if (!info) {
        callbackFuncUpdateStatus(SCRIPT_STATUS.getAccountInfoInfoError)
        return
      }
      await repository.updateAccount(accountId, info)
      callbackFuncUpdateStatus(SCRIPT_STATUS.getAccountInfoSuccess)
    }
    await page.close()
    // login

    // init feat
    try {
      const reUpPostOptions = features.find((feature) => feature.type === FEATURE_TYPE.reUpPost)
      const interactAdsOptions = features.find(
        (feature) => feature.type === FEATURE_TYPE.interactAds
      )
      const followProfiles = features.find(
        (feature) => feature.type === FEATURE_TYPE.followProfiles
      )
      const fairInteractOptions = features.find(
        (feature) => feature.type === FEATURE_TYPE.fairInteract
      )
      const buffViewsOptions = features.find((feature) => feature.type === FEATURE_TYPE.buffViews)
      const newsFeedOptions = features.find((feature) => feature.type === FEATURE_TYPE.newsFeed)
      const interactSpecializationOptions = features.find(
        (feature) => feature.type === FEATURE_TYPE.interactSpecialization
      )
      if (followProfiles?.enable) {
        followProfilesStep.init(browser, account, followProfiles)
      }
      callbackFuncUpdateStatus(SCRIPT_STATUS.start)
      if (fairInteractOptions?.enable) {
        fairInteractStep.init(browser, account, fairInteractOptions)
      }
      if (buffViewsOptions?.enable) {
        buffViewsStep.init(browser, account, buffViewsOptions)
      }
      if (reUpPostOptions?.enable) {
        crawlPostStep.init(browser, account, reUpPostOptions)
        reUpStep.init(browser, account, reUpPostOptions)
      }
      if (interactAdsOptions?.enable) {
        profileAdsStep.init(browser, account, interactAdsOptions)
      }
      if (newsFeedOptions?.enable) {
        newsFeedStep.init(browser, account, newsFeedOptions)
      }
      if (interactSpecializationOptions?.enable) {
        interactSpecializationStep.init(browser, account, interactSpecializationOptions)
      }
      callbackFuncUpdateStatus(SCRIPT_STATUS.playing)
    } catch (error) {
      logger.error('START_FEAT_ERROR', {
        error: mapErrorConstructor(error),
        accountId
      })
      callbackFuncUpdateStatus(SCRIPT_STATUS.startError)
    }
    // init feat
  } catch (error) {
    logger.error('INIT_BROWSER_ERROR', {
      error: mapErrorConstructor(error),
      accountId
    })
    callbackFuncUpdateStatus(SCRIPT_STATUS.initFail)
  }
}

const stop = async (callbackFuncUpdateStatus, accountId) => {
  if (!dataMemories[accountId]) {
    callbackFuncUpdateStatus(SCRIPT_STATUS.stopped)
    return
  }
  callbackFuncUpdateStatus(SCRIPT_STATUS.stopping)
  crawlPostStep.stop(accountId)
  reUpStep.stop(accountId)
  profileAdsStep.stop(accountId)

  await dataMemories[accountId].browser.close()
  delete dataMemories[accountId]
  callbackFuncUpdateStatus(SCRIPT_STATUS.stopped)
}

export default {
  init,
  stop
}
