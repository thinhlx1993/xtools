'use strict'
// eslint-disable-next-line no-unused-vars
const puppeteer = require('puppeteer-core')
import logger from '../../logger'
import { MAXIMUM_RETRY_CHATGPT } from '../../constants'
import chatIntegration from '../../integration/chat'
import utils from '../utils'
import {
  profilePathSelector,
  tweetDetailPathSelector,
  composeTweetPathSelector,
  dialogPathSelector
} from '../path-selector'
import { regTwDomain, regXDomain } from '../regex'
import { TWEET_MEDIA_TYPE } from '../constants'

/**
 *
 * @param {puppeteer.Page} page
 * @param {puppeteer.ElementHandle} entryElementHandle
 */
const favoriteEntry = async (page, entryElementHandle) => {
  const [likeBtn, unlikeBtn] = await Promise.all([
    entryElementHandle.$(profilePathSelector.likeBtn),
    entryElementHandle.$(profilePathSelector.unlikeBtn)
  ])
  if (!likeBtn && !unlikeBtn) {
    // logging
  }
  if (likeBtn) {
    await likeBtn.hover()
    await utils.delayRandom([1000, 1500])
    await likeBtn.click()
  }
  await utils.delayRandom([2000, 2500, 3000])
}

/**
 *
 * @param {puppeteer.Page} page
 * @param {puppeteer.ElementHandle} entryElementHandle
 * @param {string} content
 */
const commentEntry = async (page, entryElementHandle, content) => {
  const commentBtn = await entryElementHandle.$(profilePathSelector.commentBtn)
  if (!commentBtn) {
    logger.info('NOT_FOUND_COMMENT_BTN')
    // logging
    return
  }

  const waitDialogClosed = () =>
    page
      .waitForSelector(profilePathSelector.dialog, {
        visible: false,
        timeout: 30000
      })
      .catch((error) => {
        logger.info('CLOSE_DIALOG_COMMENT', error)
        return null
      })
  await commentBtn.hover()
  await utils.delayRandom([1000, 1500])
  await commentBtn.click()
  const dialog = await page
    .waitForSelector(profilePathSelector.dialog, {
      visible: true,
      timeout: 60000
    })
    .catch((error) => {
      logger.info('NOT_FOUND_DIALOG_COMMENT', error)
      return null
    })
  if (!dialog) {
    return
  }
  await page
    .waitForSelector(profilePathSelector.input, {
      visible: true,
      timeout: 60000
    })
    .catch((error) => {
      logger.info('WAIT_EDITOR_INPUT_TIMEOUT', error)
      return null
    })
  const inputContent = await dialog.$(profilePathSelector.input)
  if (!inputContent) {
    logger.info('NOT_FOUND_EDITOR_INPUT')
    // logging
    return
  }
  await inputContent.click()
  await utils.delay(utils.randomArrayNumberInString('30,50') * 100)
  await page.keyboard.type(content, { delay: 200 })
  await page.keyboard.type(' ')
  const [submitBtn, closeDialogBtn] = await Promise.all([
    dialog.$(profilePathSelector.submitBtn),
    dialog.$(profilePathSelector.closeDialogBtn)
  ])
  await utils.delay(utils.randomArrayNumberInString('30,50') * 100)
  const closeDialog = async () => {
    if (!closeDialogBtn) {
      logger.info('NOT_FOUND_CLOSE_DIALOG_BTN')
      // logging
      return
    }
    await closeDialogBtn.click()
    await utils.delayRandom([1000, 1500, 2000])
    const confirmationDialog = await page.$(composeTweetPathSelector.confirmationSheetDialog)
    if (confirmationDialog) {
      const confirmationDialogBtn = await Promise.all([
        confirmationDialog.$(composeTweetPathSelector.confirmationSheetDialogDiscardBtn),
        confirmationDialog.$(composeTweetPathSelector.confirmationSheetDialogSaveBtn)
      ]).then((res) => res.filter(Boolean)[0])
      await utils.delayRandom([1000, 1500, 2000])
      if (confirmationDialogBtn) {
        await confirmationDialogBtn.hover()
        await utils.delayRandom([300, 500, 700, 1000])
        return Promise.all([
          page
            .waitForSelector(composeTweetPathSelector.confirmationSheetDialog, {
              visible: false
            })
            .catch(() => {
              logger.error('WAIT_CONFIRMATION_SHEET_DIALOG_CLOSED_ERROR')
            }),
          confirmationDialogBtn.click()
        ])
      }
    }
    await waitDialogClosed()
  }

  if (!submitBtn) {
    logger.info('NOT_FOUND_SUBMIT_BTN')
    return closeDialog()
  }
  const enableSubmitBtnValue = await submitBtn.evaluate(
    new Function('element', `return element.getAttribute('tabindex')`)
  )
  // const enableSubmitBtnValue = await submitBtn.evaluate((element) =>
  //   element.getAttribute('tabindex')
  // )
  await utils.delayRandom()
  if (!enableSubmitBtnValue || enableSubmitBtnValue < 0) {
    logger.info('value error')
    return closeDialog()
  }
  await submitBtn.click()
  await waitDialogClosed()
}

/**
 *
 * @param {{
 *   key: string;
 *   prefix: string;
 *   maxRetryTime?: number;
 * }} chatGPT
 * @param {string} content
 * @returns {Promise<string | undefined>}
 */
const _getContentCommentByChatGPT = (chatGPT, content, tryTime = 0) => {
  const contentGPT = `${chatGPT.prefix} ${content}`
  return chatIntegration.getCompletion(chatGPT.key, contentGPT).catch(async (error) => {
    logger.error('GET_CONTENT_COMMENT_ERROR', error?.error || error)
    if (tryTime >= (chatGPT.maxRetryTime || MAXIMUM_RETRY_CHATGPT)) {
      logger.error('WAIT_CHAT_GPT_RESPONSE_LONG_TIME')
      return
    }
    await utils.delayRandom([15000, 20000, 25000, 30000])
    return _getContentCommentByChatGPT(chatGPT, content, tryTime + 1)
  })
}

/**
 *
 * @param {puppeteer.Page} page
 * @param {puppeteer.ElementHandle} entryElementHandle
 * @param {string} entryContent
 * @param {{
 *   key: string;
 *   prefix: string;
 *   maxRetryTime?: number;
 * }} chatGPT
 */
const commentEntryWithChatGPT = async (page, entryElementHandle, entryContent, chatGPT) => {
  const commentContent = await _getContentCommentByChatGPT(chatGPT, entryContent)
  if (!commentContent) {
    return false
  }
  logger.info(`ChatGPT return content ${commentContent}`)
  await commentEntry(page, entryElementHandle, commentContent)
  return true
}

/**
 *
 * @param {puppeteer.Page} page
 * @param {puppeteer.ElementHandle} entryElementHandle
 * @param {{
 *   type: 'video';
 *   durationMilliseconds: number;
 * }} video
 */
const watchVideo = async (page, entryElementHandle, video) => {
  logger.info('watchVideo')
  const videoLayout = await entryElementHandle.$(tweetDetailPathSelector.videoLayout)
  logger.info('videoLayout', videoLayout)
  if (videoLayout) {
    await videoLayout.hover()
    logger.info('delay_videoLayout.hover')
    await utils.delayRandomByArrayNumberInString('500,1000')
    logger.info('click_videoLayout.hover')
    await videoLayout.click()
  }
  let timeDelay =
    video.durationMilliseconds +
    (video.durationMilliseconds * utils.randomArrayNumberInString('5,15')) / 100
  if (timeDelay >= 30000) {
    logger.info('videoTimeMoreThan30')
    timeDelay = 30000
  }
  logger.info('waiting_video', timeDelay)
  await utils.delay(timeDelay)
  await videoLayout.hover()
  await videoLayout.click()
  await videoLayout.hover()
  const stopIcon = await videoLayout.$(tweetDetailPathSelector.videoStopPathIcon).catch(() => {
    logger.info('interact__watchVideo_NOT_FOUND_STOP_ICON')
    return null
  })
  if (stopIcon) {
    await utils.delayRandomByArrayNumberInString('500,1000')
    await videoLayout.click()
  }
  await page.mouse.reset()
  logger.info('watchVideo__done')
}

/**
 *
 * @param {puppeteer.Page} page
 * @param {puppeteer.ElementHandle} entryElementHandle
 */
const viewImage = async (page, entryElementHandle) => {
  await entryElementHandle.hover()
  await utils.delayRandomByArrayNumberInString('100,200')
  const photoCard = await entryElementHandle.$(tweetDetailPathSelector.photo)
  if (photoCard) {
    await photoCard.hover()
    await utils.delayRandomByArrayNumberInString('300,500')
    await photoCard.click()
    const dialog = await page.$(dialogPathSelector.dialog)
    if (dialog) {
      await utils.delayRandom([4000, 4500, 5000, 5500, 6000])
      const closeBtn = await dialog.$(dialogPathSelector.closeBtn)
      if (closeBtn) {
        await closeBtn.click()
      } else {
        await page.goBack()
      }
      await utils.delayRandomByArrayNumberInString('300,500')
    }
  }
  await utils.delayRandom([2000, 2250, 2500, 2750, 3000])
}

/**
 *
 * @param {puppeteer.Page} page
 * @param {puppeteer.ElementHandle} entryElementHandle
 * @param {string[]} expandedUrls
 */
const clickLinkAds = async (page, entryElementHandle, expandedUrls) => {
  logger.info('clickLinkAds')
  const linkElements = await Promise.all(
    expandedUrls
      .map((expandedUrl) => [
        entryElementHandle.$(tweetDetailPathSelector.cardLayoutDetailLinkAds(expandedUrl)),
        entryElementHandle.$(tweetDetailPathSelector.linkAds(expandedUrl))
      ])
      .flat()
  ).then((res) => res.filter(Boolean))
  if (!linkElements.length) {
    logger.info('NOT_FOUND_LINK_ADS')

    const adsLinkElements = await entryElementHandle.$$(tweetDetailPathSelector.linkAdsBlank)
    if (adsLinkElements.length) {
      const linkElementIndex = utils.randomArrayNumberInString(`0,${adsLinkElements.length - 1}`)
      const linkElement = adsLinkElements[linkElementIndex]
      await linkElement.hover()
      await utils.delayRandom()
      await linkElement.click()
    } else {
      logger.error('NOT_FOUND_LINK_ADS_BLANK')
    }
  } else {
    const linkElementIndex = utils.randomArrayNumberInString(`0,${linkElements.length - 1}`)
    const linkElement = linkElements[linkElementIndex]
    await linkElement.hover()
    await utils.delayRandom()
    await linkElement.click()
  }
  await page.mouse.reset()
  await utils.delayRandom()
  logger.info('clickLinkAds__done')
}

/**
 *
 * @param {puppeteer.Page} page
 * @param {puppeteer.ElementHandle} entryElementHandle
 * @param {{
 *   entities: {
 *     media: {
 *       type: string;
 *       durationMilliseconds: number;
 *     }[];
 *     urls: {
 *       displayUrl: string;
 *       expandedUrl: string;
 *       url: string;
 *     }[];
 *   };
 *   unifiedCard: {
 *     media: {
 *       type: string;
 *       durationMilliseconds: number;
 *     }[];
 *     urls: string[];
 *   };
 * }} entryItem
 */
const interactAdsEntry = async (page, entryElementHandle, entryItem) => {
  logger.info('interactAdsEntry_PROCESS_LINK_ADS')
  const video = entryItem.entities.media.find((media) => media.type === TWEET_MEDIA_TYPE.video)
  const unifiedCardVideo = entryItem.unifiedCard.media.find(
    (media) => media.type === TWEET_MEDIA_TYPE.video
  )
  if (video && video.durationMilliseconds) {
    await watchVideo(page, entryElementHandle, video)
  }
  if (!video && unifiedCardVideo && unifiedCardVideo.durationMilliseconds) {
    await watchVideo(page, entryElementHandle, unifiedCardVideo)
  }
  const photo = entryItem.entities.media.find((media) => media.type === TWEET_MEDIA_TYPE.photo)
  if (photo) {
    await viewImage(page, entryElementHandle)
  }
  let adsUrls = []
  entryItem.entities.urls.forEach((urlItem) => adsUrls.push(urlItem.expandedUrl))
  entryItem.unifiedCard.urls.forEach((url) => adsUrls.push(url))
  adsUrls = adsUrls.filter((url) => !regTwDomain.test(url) && !regXDomain.test(url))
  adsUrls = [...new Set(adsUrls)]
  if (adsUrls.length) {
    logger.info('adsUrls', adsUrls)
    await clickLinkAds(page, entryElementHandle, adsUrls)
    await utils.delayRandom()
  }
  await utils.delayRandom()
  logger.info('interactAds__done')
}

export default {
  favoriteEntry,
  commentEntry,
  commentEntryWithChatGPT,
  watchVideo,
  viewImage,
  clickLinkAds,
  interactAdsEntry
}
