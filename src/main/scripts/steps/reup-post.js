// import puppeteer from 'puppeteer-core'
import { CronJob } from 'cron'
import chatIntegration from '../../integration/chat'
import repository from '../../database/repository'
import logger from '../../logger'
import store from '../../store'
import { mapErrorConstructor } from '../../helpers'
import { STORE_KEYS } from '../../constants'
import { authenticateProxy } from '../helpers'
import { TWEET_MEDIA_TYPE, PAGE_URL } from '../constants'
import utils from '../utils'
import { composeTweetPathSelector } from '../path-selector'
import mapper from '../mapper'
import { getProfileData, getTop3PostSaved, softDeletePost } from '../services/backend'

/**
 * @typedef {Object} FeatOptions
 * @property {string} profiles - The profiles in string.
 * @property {boolean} mixRandomProfiles - Enable mix.
 * @property {string} chatOpenAIPrefix
 * @property {boolean} reUpWithImage
 * @property {boolean} reUpWithVideo
 * @property {string} randomTotalPostsReUp
 * @property {string} timesReUp
 */

const getContentReUp = (chatOpenAIKey, content, tryTime = 0) => {
  if (tryTime > 50) {
    logger.error('WAIT_CHAT_GPT_RESPONSE_LONG_TIME')
    return
  }
  return chatIntegration
    .getCompletion(chatOpenAIKey, content, 'Can you please paraphase the text bellow')
    .catch(async (error) => {
      logger.error('GET_CONTENT_RE_UP_ERROR', error?.error || error)
      await utils.delayRandom([3500, 4000, 4500, 5000, 5500])
      return getContentReUp(chatOpenAIKey, content, tryTime + 1)
    })
}

/**
 * @type {Object.<string, Array<CronJob>>}
 */
const dataMemories = {}

/**
 * @param {puppeteer.Page} page
 * @param {{
 *   chatOpenAIKey: string;
 *   chatOpenAIPrefix: string;
 *   reUpWithImage: boolean;
 *   reUpWithVideo: boolean;
 * }} openAIConfig
 * @param {{
 * post_id: 198a356d-2601-4e90-a124-cbd8cf890ee2;
 * content: object,
 * tw_post_id: tweet-1754103757909147779
 * profile_crawl: MartinH69784686
 * }} twPost
 */
const _base = async (page, openAIConfig, twPost) => {
  const profileCrawl = twPost.profile_crawl
  logger.info(`start reup post ${profileCrawl}`)
  const oldestPost = JSON.parse(twPost.content)
  try {
    /** */
    const reMapped = mapper.mapUserTweet(oldestPost)
    if (!reMapped || reMapped.isAds || reMapped.isRePost) {
      await softDeletePost(twPost.tw_post_id, { is_deleted: true })
      logger.info(`Cancel reup post ${profileCrawl}`)
      return
    }
    // prepare post
    const post = {
      legacy: {
        fullText: reMapped.fullText,
        extendedEntities: {
          media: (
            oldestPost.content.itemContent.tweet_results.result.legacy.extended_entities?.media ||
            []
          )
            .filter((item) => [TWEET_MEDIA_TYPE.photo, TWEET_MEDIA_TYPE.video].includes(item.type))
            .map((item) => ({
              type: item.type,
              expandedUrl: item.expanded_url,
              mediaUrlHttps: item.media_url_https
            }))
        },
        quotedStatusPermalink:
          oldestPost.content.itemContent.tweet_results.result.legacy.quoted_status_permalink
      }
    }
    let contentInput = await getContentReUp(
      openAIConfig.chatOpenAIKey,
      `${openAIConfig.chatOpenAIPrefix} ${post.legacy.fullText}`
    )
    if (!contentInput) {
      return
    }

    // ??
    if (post.legacy.quotedStatusPermalink?.expanded || post.legacy.quotedStatusPermalink?.url) {
      contentInput += `\n`
      contentInput +=
        post.legacy.quotedStatusPermalink.expanded || post.legacy.quotedStatusPermalink.url
    }

    // hashtag trending
    const hashtagTrendingList = JSON.parse(store.get(STORE_KEYS.TRENDING_HASH_TAG) || '[]')
    if (hashtagTrendingList.length) {
      const hashtagRandom = utils.random(hashtagTrendingList)
      contentInput += '\n'
      contentInput += `#${hashtagRandom.replace(/\s/g, '')}`
      contentInput += ' '
    }

    // media link (image, video)
    post.legacy.extendedEntities.media.forEach((mediaItem) => {
      switch (mediaItem.type) {
        case TWEET_MEDIA_TYPE.video:
          if (!openAIConfig.reUpWithVideo) {
            return
          }
          break
        case TWEET_MEDIA_TYPE.gif:
        case TWEET_MEDIA_TYPE.photo:
          if (!openAIConfig.reUpWithImage) {
            return
          }
          break
        default:
          return
      }
      contentInput += '\n'
      contentInput += mediaItem.expandedUrl
    })

    // compose post
    await page.waitForSelector(composeTweetPathSelector.input, {
      visible: true,
      timeout: 15000
    })
    await page.click(composeTweetPathSelector.input)
    await page.keyboard.sendCharacter(contentInput)
    await utils.delay()
    const submitBtn = await page.$(composeTweetPathSelector.submitBtn)
    if (!submitBtn) {
      return
    }
    await submitBtn.hover()
    await utils.delayRandom()
    await submitBtn.click()
    await page.waitForSelector(composeTweetPathSelector.dialog, {
      visible: false,
      timeout: 5000
    })
    await softDeletePost(twPost.tw_post_id, { is_deleted: true })
    logger.info('success')
  } catch (error) {
    logger.error('REUP_POST_ERROR', {
      error: mapErrorConstructor(error),
      tw_post_id: twPost.tw_post_id
    })
  } finally {
    logger.info(`reup post done ${profileCrawl}`)
  }
}

/**
 *
 * @param {puppeteer.Browser} browser the Puppeteer Browser
 * @param {{
 *   id: number;
 *   proxy: string;
 *   chatOpenAIKey: string;
 * }} account The Account
 * @param {FeatOptions} featOptions The featOptions object
 */
const _func = async (page, profileId, featOptions) => {
  const profileData = await getProfileData(profileId, {})

  logger.info('startReUpPosts')
  if (!profileData.gpt_key) {
    logger.info('reUpPostsCancel')
    return
  }
  // const total = utils.randomArrayNumberInString(featOptions.randomTotalPostsReUp || '1,1')
  // logger.info('totalPostsReUp', total)
  const posts = await getTop3PostSaved(profileData.profile_id)

  // Assuming posts.data contains the array of posts
  const postsLength = posts.data.length
  if (postsLength === 0) {
    logger.error(`Reup failed, not found any posts`)
    return
  }

  // Pick a random index
  const randomIndex = Math.floor(Math.random() * postsLength)

  // Select a random post
  const post = posts.data[randomIndex]

  logger.info(`Process ${JSON.stringify(posts)} posts`)

  // Navigate to the page to create a post
  await page.goto(PAGE_URL.createPost, { waitUntil: 'domcontentloaded' })

  // Process the randomly selected post
  // {
  //   "post_id": "198a356d-2601-4e90-a124-cbd8cf890ee2",
  //   "title": null,
  //   "content": ""
  //   "like": "760",
  //   "comment": "163",
  //   "share": "56",
  //   "view": null,
  //   "username": "crazyclipsonly",
  //   "tw_post_id": "tweet-1754103757909147779",
  //   "post_date": "Sun Feb 04 11:25:00 +0000 2024",
  //   "profile_crawl": "MartinH69784686",
  //   "user_crawl": "admin",
  //   "created_at": "04-02-2024 12:31"
  // }
  const openAIPrefix = featOptions.chatOpenAIPrefix.split('|')
  // Generate a random index based on the length of the list
  const randomPrefix = Math.floor(Math.random() * openAIPrefix.length)

  // Select the item at the random index
  const randomItem = openAIPrefix[randomPrefix]
  await _base(
    page,
    {
      chatOpenAIKey: profileData.gpt_key,
      chatOpenAIPrefix: randomItem,
      reUpWithImage: featOptions.reUpWithImage,
      reUpWithVideo: featOptions.reUpWithVideo
    },
    post
  )

  // Optionally wait after processing the post, if necessary
  await utils.delayRandom()
  logger.info('reUpPostsSuccess')
}

const init = _func

const stop = (accountId) => {
  clearTimeout(dataMemories[accountId])
  delete dataMemories[accountId]
}

export default {
  init,
  stop
}
