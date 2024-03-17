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
import moment from 'moment-timezone'
import {
  getEventsLogs,
  createEventLogs,
  getGiverEventsLogs,
  createAnewPost,
  updateProfileData
} from '../../services/backend'
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
  const totalPosts = utils.randomArrayNumberInString(featOptions.randomTotalPostsForInteractAds)
  let totalCount = 0
  let pinEntryAdded = false
  let currentEntrie = 0
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

  const utcPlus7 = 'Asia/Bangkok'

  // Get the current date in UTC+7
  const todayInUtcPlus7 = moment().tz(utcPlus7).startOf('day')

  // Filter entries that belong to today in UTC+7
  const entriesTodayUtcPlus7 = entries.filter((entry) => {
    const entryItem = mapper.mapUserTweet(entry)
    if (entryItem) {
      const createdAtUtc = moment(entryItem.createdAt, 'ddd MMM DD HH:mm:ss Z YYYY').utc()
      return createdAtUtc.isSame(todayInUtcPlus7, 'day')
    }
  })

  // update post today
  await updateProfileData(receiverData.profile_id, {
    today_post_count: entriesTodayUtcPlus7.length
  })

  while (entries.length) {
    const entry = entries[0]
    if (!entry) {
      logger.info('not found entry post')
      await utils.delayRandom()
      return
    }
    entries.shift()

    if (totalCount >= totalPosts) {
      await _getDelayTimeAction(featOptions)
      logger.info(`click ads done with totalPosts ${receiverData.username}`)
      return
    }

    currentEntrie = currentEntrie + 1
    totalCount += 1
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

    logger.info(`Created At: ${entryItem.createdAt}`)

    // logger.info('entryItem', entryItem)

    // const postData = {
    //   profile_id: receiverData.profile_id,
    //   username: receiverData.username,
    //   tw_post_id: entry.entryId,
    //   like: entry.content.itemContent.tweet_results.result.legacy.favorite_count,
    //   comment: entry.content.itemContent.tweet_results.result.legacy.reply_count,
    //   share: entry.content.itemContent.tweet_results.result.legacy.retweet_count,
    //   content: JSON.stringify(entry),
    //   post_date: entry.content.itemContent.tweet_results.result.legacy.created_at
    // }
    // await createAnewPost(postData)

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

    if (Math.random() < 0.5) {
      const actionType = Math.random() < 0.5 ? 'comment' : 'like' // 50% chance for each
      logger.info(
        `actionType ${actionType} allowLikeAction ${featOptions.allowLikeAction} currentEntrie ${currentEntrie} isAds ${entryItem.isAds} receiverData comment_count ${receiverData.comment_count} giverData comment_count ${giverData.comment_count}`
      )
      if (
        actionType === 'like' &&
        featOptions.allowLikeAction &&
        currentEntrie === 1 &&
        !entryItem.isAds &&
        receiverData.like_count <= 4 &&
        giverData.like_count <= 4
      ) {
        await utils.delayRandom()
        logger.info(`${receiverData.username} favoriteEntry`)
        await interactAction.favoriteEntry(page, elementHandle)
        await createEventLogs({
          event_type: actionType,
          profile_id: receiverData.profile_id,
          profile_id_interact: giverData.profile_id,
          issue: 'OK'
        })
      } else if (
        actionType === 'comment' &&
        !entryItem.isAds &&
        currentEntrie === 1 &&
        featOptions.allowCommentAction &&
        receiverData.gpt_key &&
        featOptions.chatOpenAIPrefix &&
        receiverData.comment_count <= 4 &&
        giverData.comment_count <= 4
      ) {
        // maximum 5 comment likes per user per day
        logger.info(
          `${receiverData.username} today have ${receiverData.comment_count} ${actionType}`
        )
        const choices = featOptions.chatOpenAIPrefix.split('|')
        const chosenOption = choices[Math.floor(Math.random() * choices.length)]
        logger.info(`${receiverData.username} commentEntryWithChatGPT`)
        const commentStatus = await interactAction.commentEntryWithChatGPT(
          page,
          elementHandle,
          entryItem.fullText,
          {
            key: receiverData.gpt_key,
            prefix: chosenOption,
            maxRetryTime: 2
          }
        )
        if (commentStatus) {
          await createEventLogs({
            event_type: actionType,
            profile_id: receiverData.profile_id,
            profile_id_interact: giverData.profile_id,
            issue: 'OK'
          })
        } else {
          await createEventLogs({
            event_type: actionType,
            profile_id: receiverData.profile_id,
            profile_id_interact: giverData.profile_id,
            issue: 'Comment error'
          })
        }
      }
    }

    if (entryItem.isRePost || entryItem.replyCount < 2) {
      continue
    }
    if (entryItem.isAds && receiverData.click_count < 100) {
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

    if (Math.random() < 0.3 && receiverData.click_count < 100) {
      await Promise.all([
        postDetail(page, giverData, receiverData, featOptions, {
          entryId: entryItem.postId,
          username: entryItem.authorProfileId,
          limitedActions: entryItem.limitedActions,
          fullText: entryItem.fullText
        }),
        entryUrl.click().then(() => page.mouse.reset())
      ])
      await navAction.back(page)
    } else {
      await utils.delayRandom()
    }
  }
  logger.info(`click ads feed done ${receiverData.username}`)
}
