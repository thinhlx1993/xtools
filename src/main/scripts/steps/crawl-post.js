// eslint-disable-next-line no-unused-vars
import puppeteer from 'puppeteer-core'
import { authenticateProxy, testRegHttpEvent } from '../helpers'
import { PAGE_URL } from '../constants'
import logger from '../../logger'
import { regGraphAPIUserTws } from '../regex'
import utils from '../utils'
import mapper from '../mapper'
import repository from '../../database/repository'
import { getProfileData, getLastPostSaved, createAnewPost } from '../services/backend'
const dataMemories = {}

/**
 *
 * @param {string} profileCrawl the profile crawl
 * @param {object} profileData the profiles do the crawl
 * @param {{data: object}} response
 * @returns
 */
const _filterAndCache = async (profileCrawl, profileData, response) => {
  const posts = response.data.user.result.timeline_v2.timeline.instructions
    .find((instruction) => instruction.type === 'TimelineAddEntries')
    ?.entries?.filter((entry) => entry.content.entryType === 'TimelineTimelineItem')
  if (!posts) {
    throw new Error('FILTER_POST_ERROR')
  }
  const lastPostCrawl = await getLastPostSaved(profileCrawl)
  let lastEntryId = null
  if (lastPostCrawl.result_count > 0) {
    lastEntryId = lastPostCrawl[0]?.tw_post_id
  }
  const currentEntryIds = posts.map((post) => post.entryId)
  const newEntryIndex = currentEntryIds.indexOf(lastEntryId)
  if (lastEntryId && newEntryIndex < 1) {
    return
  }
  const newEntries = posts.slice(0, (lastEntryId ? newEntryIndex : 0) + 1)
  try {
    const entriesSave = newEntries
      .map((entry) => {
        const reMapped = mapper.mapUserTweet(entry)
        if (!reMapped || reMapped.isAds || reMapped.isRePost) {
          return
        }
        //  entry: JSON.stringify(entry),
        // return {
        //   profile_id: profileData.profile_id,
        //   username: profileCrawl,
        //   tw_post_id: entry.entryId,
        //   like: entry.content.itemContent.tweet_results.result.legacy.favorite_count,
        //   comment: entry.content.itemContent.tweet_results.result.legacy.reply_count,
        //   share: entry.content.itemContent.tweet_results.result.legacy.retweet_count,
        //   content: JSON.stringify(entry),
        //   post_date: entry.content.itemContent.tweet_results.result.legacy.created_at
        // }
        return {
          profile_id: profileData.profile_id,
          username: profileCrawl,
          tw_post_id: entry.entryId,
          like: entry.content.itemContent.tweet_results.result.legacy.favorite_count,
          comment: entry.content.itemContent.tweet_results.result.legacy.reply_count,
          share: entry.content.itemContent.tweet_results.result.legacy.retweet_count,
          content: JSON.stringify(entry),
          post_date: entry.content.itemContent.tweet_results.result.legacy.created_at
        }
      })
      .filter(Boolean)
    if (entriesSave.length) {
      // logger.info(`entriesSave ${JSON.stringify(entriesSave)}`)
      // await repository.savePosts(entriesSave)
      for (const post of entriesSave) {
        await createAnewPost(post)
      }
    }
  } catch (error) {
    logger.error('INSERT_NEW_POSTS_ERROR', error)
    logger.info('newEntries', { newEntries: JSON.stringify(newEntries) })
  }
}

/**
 * @param {puppeteer.Page} page the Puppeteer Page
 * @param {object} profileData the account action
 * @param {string} profileCrawl the account destination
 */
const _base = async (page, profileData, profileCrawl) => {
  try {
    await page.goto(PAGE_URL.profile(profileCrawl), {
      waitUntil: 'domcontentloaded'
    })
    const postResponse = await page.waitForResponse(
      (response) => testRegHttpEvent(regGraphAPIUserTws, response) && response.status() === 200
    )
    await _filterAndCache(profileCrawl, profileData, await postResponse.json())
    // await _filterAndCache(profileId, accountId, await postResponse.json())
  } catch (error) {
    logger.error('CRAWL_POST_ERROR', error)
  }
}

/**
 * @param {puppeteer.Page} page the Puppeteer Page
 * @param {{
 *   id: number;
 *   proxy: string;
 * }} account The Account
 * @param {{
 *   profiles: string;
 *   intervalTimeCheckNewPost: number;
 * }} featOptions The featOptions object
 */
const _func = async (page, profileId, featOptions) => {
  const profileData = await getProfileData(profileId, {})
  let profileIds = featOptions.profiles
  logger.info(`Found profiles: ${profileIds}`)
  profileIds = utils.shuffle(profileIds).slice(0, 3)

  for (let index = 0; index < profileIds.length; index++) {
    const profileCrawl = profileIds[index]
    await _base(page, profileData, profileCrawl)
    await utils.delayRandom([10000, 11000, 12000, 13000])
  }
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
