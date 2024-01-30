import logger from '../../../logger'
import { handleResponseUserTweets, windowScrollBy } from '../../helpers'
import { PAGE_URL, ENTRY_TYPE } from '../../constants'
import utils from '../../utils'
import mapper from '../../mapper'
import { commonPathSelector } from '../../path-selector'
import { tweetXPath } from '../../x-path'
// eslint-disable-next-line no-unused-vars
import { Page, Account, InteractAdsOptions } from '../../define-type'
import scrollAction from '../../actions/scroll'
import navAction from '../../actions/nav'
import interactAction from '../../actions/interact'
import postDetail from './post-detail'

/**
 *
 * @param {InteractAdsOptions} featOptions
 * @returns
 */
const _getDelayTimeAction = (featOptions) =>
  utils.delayRandomByArrayNumberInString(featOptions.randomDelayTimeActions, {
    unit: 'second'
  })

/**
 *
 * @param {Page} page
 * @param {Account} account
 * @param {InteractAdsOptions} featOptions
 * @param {string} profileId
 */
export default async (page, giverData, featOptions, receiverData) => {
  logger.info(`start view news feed ${giverData.username}`)
  logger.info(featOptions)
  const totalPosts = utils.randomArrayNumberInString(featOptions.randomTotalPostsForInteractAds)
  let totalCount = 0
  let pinEntryAdded = false
  const entries = []
  handleResponseUserTweets(page, ({ pinEntry, addEntries }) => {
    if (pinEntry && !pinEntryAdded) {
      pinEntryAdded = true
      entries.push(pinEntry)
    }
    entries.push(...addEntries)
  })
  await page.goto(PAGE_URL.profile(receiverData.username))
  logger.info(`done goto ${receiverData.username}`)
  await page
    .waitForSelector(commonPathSelector.timelineSection, {
      visible: true,
      timeout: 30000
    })
    .catch(() => {
      logger.info('profileAds__WAIT_TIME_LINE_SECTION_TIMEOUT')
    })
  await utils.delayRandom()
  logger.info('done wait timeline section')
  while (entries.length) {
    const entry = entries[0]
    if (!entry) {
      logger.info('not found entry post')
      await utils.delayRandom()
      return
    }
    entries.shift()
    const entryType = entry.content.entryType
    if (entryType === ENTRY_TYPE.module) {
      await windowScrollBy(page, 300)
      await _getDelayTimeAction(featOptions)
      continue
    }
    if (entryType !== ENTRY_TYPE.item) {
      continue
    }
    const entryItem = mapper.mapUserTweet(entry)
    logger.info('entryItem', entryItem)
    await Promise.resolve(
      entryItem.isAds
        ? page.waitForXPath(tweetXPath.entryAds(entryItem.authorProfileId, entryItem.postId), {
            visible: true,
            timeout: 5000
          })
        : page.waitForSelector(tweetXPath.postCell(entryItem.authorProfileId, entryItem.postId), {
            visible: true,
            timeout: 5000
          })
    ).catch(() => {
      logger.info('waitForEntryItemTimeout')
    })
    const elementHandle = await page
      .$x(
        entryItem.isAds
          ? tweetXPath.entryAds(entryItem.authorProfileId, entryItem.postId)
          : tweetXPath.postCell(entryItem.authorProfileId, entryItem.postId)
      )
      .then((res) => res[0])
    if (!elementHandle) {
      logger.info('!elementHandle')
      continue
    }
    await scrollAction.scrollToEntry(page, elementHandle)
    await _getDelayTimeAction(featOptions)
    if (entryItem.isRePost || entryItem.replyCount < 1) {
      continue
    }
    if (entryItem.isAds) {
      await scrollAction.scrollToEntryMedia(page, elementHandle)
      await _getDelayTimeAction(featOptions)
      await interactAction.interactAdsEntry(page, elementHandle, entryItem)
      await page.mouse.reset()
      await _getDelayTimeAction(featOptions)
      continue
    }
    const entryUrl = await elementHandle.$(
      commonPathSelector.entryUrl(entryItem.authorProfileId, entryItem.postId)
    )
    if (!entryUrl) {
      continue
    }
    await _getDelayTimeAction(featOptions)
    await entryUrl.hover()
    await utils.delayRandom()
    await Promise.all([
      postDetail(page, giverData, featOptions, {
        entryId: entryItem.postId,
        username: entryItem.authorProfileId,
        limitedActions: entryItem.limitedActions,
        fullText: entryItem.fullText
      }),
      entryUrl.click().then(() => page.mouse.reset())
    ])
    totalCount += 1
    await navAction.back(page)
    if (totalCount >= totalPosts) {
      await _getDelayTimeAction(featOptions)
      logger.info(`view news feed done with totalPosts ${receiverData.username}`)
      return
    }
  }
  logger.info(`view news feed done ${receiverData.username}`)
}
