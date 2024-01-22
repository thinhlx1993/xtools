// eslint-disable-next-line no-unused-vars
import puppeteer from 'puppeteer-core'
import { authenticateProxy, testRegHttpEvent } from '../helpers'
import { PAGE_URL } from '../constants'
import logger from '../../logger'
import { regGraphAPIUserTws } from '../regex'
import utils from '../utils'
import mapper from '../mapper'
import repository from '../../database/repository'

const dataMemories = {}

/**
 *
 * @param {string} profileId
 * @param {number} accountId
 * @param {{data: object}} response
 * @returns
 */
const _filterAndCache = async (profileId, accountId, response) => {
  const posts = response.data.user.result.timeline_v2.timeline.instructions
    .find((instruction) => instruction.type === 'TimelineAddEntries')
    ?.entries?.filter((entry) => entry.content.entryType === 'TimelineTimelineItem')
  if (!posts) {
    throw new Error('FILTER_POST_ERROR')
  }
  const lastPostCrawl = await repository.getLastPostSaved(accountId, profileId)
  const lastEntryId = lastPostCrawl?.twPostId
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
        return {
          crawlBy: accountId,
          profileId,
          twPostId: entry.entryId,
          entry: JSON.stringify(entry),
          entryCreatedAt: entry.content.itemContent.tweet_results.result.legacy.created_at
        }
      })
      .filter(Boolean)
    if (entriesSave.length) {
      await repository.savePosts(entriesSave)
    }
  } catch (error) {
    logger.error('INSERT_NEW_POSTS_ERROR', error)
    logger.info('newEntries', { newEntries: JSON.stringify(newEntries) })
  }
}

/**
 * @param {puppeteer.Page} page the Puppeteer Page
 * @param {number} accountId
 * @param {string} profileId
 */
const _base = async (page, accountId, profileId) => {
  try {
    await page.goto(PAGE_URL.profile(profileId), {
      waitUntil: 'domcontentloaded'
    })
    const postResponse = await page.waitForResponse(
      (response) => testRegHttpEvent(regGraphAPIUserTws, response) && response.status() === 200
    )
    await _filterAndCache(profileId, accountId, await postResponse.json())
  } catch (error) {
    logger.error('CRAWL_POST_ERROR', error)
  } finally {
  }
}

/**
 * @param {puppeteer.Browser} browser the Puppeteer Browser
 * @param {{
 *   id: number;
 *   proxy: string;
 * }} account The Account
 * @param {{
 *   profiles: string;
 *   intervalTimeCheckNewPost: number;
 * }} featOptions The featOptions object
 */
const _func = async (browser, account, featOptions) => {
  // console.log("startCrawlPosts");
  const page = await browser.newPage()
  await authenticateProxy(page, account.proxy)
  let profileIds = featOptions.profiles
    .split('\n')
    .map((profileId) => profileId.trim())
    .filter(Boolean)
  if (featOptions.mixRandomProfiles) {
    profileIds = utils.shuffle(profileIds)
  }
  for (let index = 0; index < profileIds.length; index++) {
    const profileId = profileIds[index]
    await _base(page, account.id, profileId)
    await utils.delayRandom([10000, 11000, 12000, 13000])
  }
  await page.close()
  // console.log("crawlPostsSuccess");
  if (featOptions.intervalTimeCheckNewPost > 0) {
    dataMemories[account.id] = setTimeout(
      () => _func(browser, account, featOptions),
      featOptions.intervalTimeCheckNewPost * 60000
    )
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
