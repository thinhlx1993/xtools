import puppeteer from 'puppeteer-core'
import { mapErrorConstructor } from '../../helpers'
import logger from '../../logger'
import { authenticateProxy, testRegHttpEvent, windowScrollBy } from '../helpers'
import utils from '../utils'
import { PAGE_URL } from '../constants'
import mapper from '../mapper'
import { regGraphAPIUserByScreenName, regGraphAPIBlueVerifiedFollowers } from '../regex'
import { profilePathSelector, followerPathSelector } from '../path-selector'
import { followXPath } from '../x-path'

const dataMemories = {}

/**
 *
 * @param {puppeteer.Page} page
 * @param {number} totalPerProfile
 */
const _followBlueVerifiedFollowers = async (page, totalPerProfile) => {
  console.log('_followBlueVerifiedFollowers__start')
  const blueVerifiedFollowersEvent = await page.waitForResponse((response) => {
    return testRegHttpEvent(regGraphAPIBlueVerifiedFollowers, response) && response.status() === 200
  })
  const blueVerifiedFollowersResponse = await blueVerifiedFollowersEvent.json()
  const followers =
    blueVerifiedFollowersResponse.data.user.result.timeline.timeline.instructions.find(
      (instruction) => instruction.type === 'TimelineAddEntries'
    )?.entries || []
  if (!followers.length) {
    await utils.delayRandom()
    return
  }
  for (let index = 0; index < followers.length; index++) {
    console.log('index', index)
    const follower = followers[index]
    const followerMapped = mapper.mapFollower(follower)
    if (!followerMapped) {
      continue
    }
    if (followerMapped.following) {
      await utils.delayRandom()
      continue
    }
    const itemElementHandle = await page
      .$x(followXPath.followerCell(followerMapped.username))
      .then((res) => res[0])
    if (!itemElementHandle) {
      await utils.delayRandom()
      continue
    }

    if (index > 0) {
      const boundingBox = await itemElementHandle.boundingBox()
      const scrollToContentHeight = boundingBox.y / 4
      await windowScrollBy(page, scrollToContentHeight)
    }

    const [avatarElement, followBtn] = await Promise.all([
      itemElementHandle.$(followerPathSelector.avatar(followerMapped.username)),
      itemElementHandle.$(followerPathSelector.followBtn(followerMapped.profileId))
    ])
    if (!followBtn) {
      await utils.delayRandom()
      continue
    }
    if (avatarElement) {
      // logging
      await avatarElement.hover()
      await utils.delayRandom([5000, 5500, 6000, 6500, 7000, 7500, 8000])
    }
    if (index + 1 >= totalPerProfile) {
      await utils.delayRandom()
      return
    }
    await followBtn.hover()
    await utils.delayRandom([500, 700, 900])
    await followBtn.click()
    await utils.delayRandom()
  }
  console.log('_followBlueVerifiedFollowers__done')
}

/**
 * @param {puppeteer.Page} page
 * @param {number} totalPerProfile
 * @param {string} username
 */
const _base = async (page, totalPerProfile, username) => {
  console.log(`start follow ${username}`)
  try {
    // goto profile
    await page.goto(PAGE_URL.profile(username), {
      waitUntil: 'domcontentloaded'
    })
    const userResponse = await page.waitForResponse(
      (response) =>
        testRegHttpEvent(regGraphAPIUserByScreenName, response) && response.status() === 200
    )
    const user = await userResponse.json()
    const profileId = user.data.user.result.rest_id
    const isBlueVerified = user.data.user.result.is_blue_verified
    const followersCount = user.data.user.result.legacy.followers_count
    const normalFollowersCount = user.data.user.result.legacy.normal_followers_count
    await utils.delayRandom()
    if (!isBlueVerified) {
      console.log('not_blue_verified')
      return
    }
    await utils.delayRandom()
    // check followed or not
    const followBtnPathSelector = profilePathSelector.followBtn(profileId)
    const [followBtn, unFollowBtn] = await Promise.all([
      page.$(followBtnPathSelector),
      page.$(profilePathSelector.unFollowBtn(profileId))
    ])
    if (followBtn) {
      await followBtn.hover()
      await utils.delayRandom([500, 700, 900])
      await followBtn.click()
      await page
        .waitForSelector(followBtnPathSelector, {
          visible: true,
          timeout: 5000
        })
        .catch((error) => {
          console.log('FOLLOW_PROFILE_ERROR', error)
        })
      // return;
    }
    if (unFollowBtn) {
      console.log(`profile_id ${profileId} has followed`)
    }
    if (!followBtn && !unFollowBtn) {
      console.error('FOLLOW_HAVE_SOMETHING_WRONG')
    }

    const verifiedFollowerLink = await page.$(profilePathSelector.verifiedFollowerLink(username))
    if (!verifiedFollowerLink) {
      logger.info('NOT_FOUND_VERIFIED_FOLLOWERS_LINK', { username })
      return
    }
    await verifiedFollowerLink.hover()
    await utils.delayRandom([500, 700, 900])
    if (followersCount < 0 && normalFollowersCount < 0) {
      return
    }
    await Promise.all([
      _followBlueVerifiedFollowers(page, totalPerProfile),
      verifiedFollowerLink.click()
    ])
  } catch (error) {
    console.log('FOLLOW_PROFILE_HAVE_ERROR', error)
  } finally {
    console.log(`follow done ${username}`)
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
 *   randomTotalFollowProfiles: string;
 * }} featOptions The featOptions object
 */
const init = async (browser, account, featOptions) => {
  console.log('start follow func')
  dataMemories[account.id] = {}
  const page = await browser.newPage()
  await authenticateProxy(page, account.proxy)
  const profileIds = utils.shuffle(
    featOptions.profiles
      .split('\n')
      .map((profileId) => profileId.trim())
      .filter(Boolean)
  )
  const total = utils.randomArrayNumberInString(featOptions.randomTotalFollowProfiles)
  const profiledLength = profileIds.length
  const totalFollowsPerProfile = total / profiledLength
  console.log('total', total)
  console.log('totalFollowsPerProfile', totalFollowsPerProfile)
  for (let index = 0; index < profiledLength; index++) {
    try {
      const profileId = profileIds[index]
      await _base(page, totalFollowsPerProfile, profileId)
      await utils.delayRandom([10000, 11000, 12000, 13000])
    } catch (error) {
      if (!dataMemories[account.id]) {
        return
      }
      throw error
    }
  }
  await page.close()
  console.log('follow func done')
}

const stop = (accountId) => {
  delete dataMemories[accountId]
}


export default {
  init,
  stop,
}
