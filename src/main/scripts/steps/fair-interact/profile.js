import { handleResponseUserTweets, windowScrollBy } from '../../helpers'
import utils from '../../utils'
import mapper from '../../mapper'
import { commonPathSelector } from '../../path-selector'
import { tweetXPath } from '../../x-path'
import { ENTRY_TYPE, PAGE_URL } from '../../constants'
import { Page, Account, FairInteractOptions } from '../../define-type'
import scrollAction from '../../actions/scroll'
import navAction from '../../actions/nav'
import interact from './interact'

/**
 *
 * @param {Page} page
 * @param {Account} account
 * @param {FairInteractOptions} featOptions
 */
export default async (page, account, featOptions) => {
  console.log('profileInteraction__start')
  let totalCount = 0
  let pinEntryAdded = false
  const entries = []
  const interactedUsername = []

  handleResponseUserTweets(page, ({ pinEntry, addEntries }) => {
    if (pinEntry && !pinEntryAdded) {
      pinEntryAdded = true
      entries.push(pinEntry)
    }
    entries.push(...addEntries)
  })
  await page.goto(PAGE_URL.profile(account.screenName))
  await page.waitForSelector(commonPathSelector.primaryColumn, {
    visible: true,
    timeout: 30000
  })
  await utils.delayRandom()

  while (entries.length) {
    const entry = entries[0]
    if (!entry) {
      console.log('not found entry post')
      await utils.delayRandom()
      return
    }
    entries.shift()
    const entryType = entry.content.entryType
    if (entryType === ENTRY_TYPE.module) {
      await windowScrollBy(page, 300)
      continue
    }
    if (entryType !== ENTRY_TYPE.item) {
      continue
    }
    const entryItem = mapper.mapUserTweet(entry)
    const elementHandle = await page
      .$x(
        entryItem.isAds
          ? tweetXPath.entryAds(entryItem.authorProfileId, entryItem.postId)
          : tweetXPath.postCell(entryItem.authorProfileId, entryItem.postId)
      )
      .then((res) => res[0])
    if (!elementHandle) {
      continue
    }
    await scrollAction.scrollToEntry(page, elementHandle)
    if (entryItem.isAds || entryItem.isRePost || entryItem.replyCount < 1) {
      continue
    }
    const entryUrl = await elementHandle.$(
      commonPathSelector.entryUrl(entryItem.authorProfileId, entryItem.postId)
    )
    if (!entryUrl) {
      continue
    }
    await entryUrl.hover()
    await utils.delayRandom()
    await Promise.all([interact(page, account, featOptions, interactedUsername), entryUrl.click()])
    totalCount += 1
    await navAction.back(page)
    if (totalCount >= featOptions.totalPosts) {
      await utils.delayRandom()
      return
    }
  }
  console.log('profileInteraction__end')
}
