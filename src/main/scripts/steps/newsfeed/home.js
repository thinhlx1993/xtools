import logger from '../../../logger'
import { PAGE_URL, ENTRY_TYPE } from '../../constants'
import utils from '../../utils'
import mapper from '../../mapper'
import { commonPathSelector } from '../../path-selector'
import { tweetXPath } from '../../x-path'
import { handleResponseHomeTimeline, windowScrollBy } from '../../helpers'
import { Page, Account, NewsFeedOptions } from '../../define-type'
import scrollAction from '../../actions/scroll'
import interactAction from '../../actions/interact'

/**
 *
 * @param {NewsFeedOptions} featOptions
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
 * @param {NewsFeedOptions} featOptions
 * @param {() => boolean} callbackDoneEntry
 */
export default async (page, account, featOptions, callbackDoneEntry) => {
  console.log(`newsFeed__home_start`)
  const entries = []
  handleResponseHomeTimeline(page, ({ addEntries }) => entries.push(...addEntries))
  await page.goto(PAGE_URL.home)
  console.log('done goto')
  await page
    .waitForSelector(commonPathSelector.timelineSection, {
      visible: true,
      timeout: 30000
    })
    .catch(() => {
      logger.info('profileAds__WAIT_TIME_LINE_SECTION_TIMEOUT')
    })
  await utils.delayRandom()
  console.log('done wait timeline section')
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
      await _getDelayTimeAction(featOptions)
      continue
    }
    if (entryType !== ENTRY_TYPE.item) {
      continue
    }
    const subEntryItems = mapper.mapTweetDetail(entry)
    for (let index = 0; index < subEntryItems.length; index++) {
      const subEntryItem = subEntryItems[index]
      console.log('subEntryItem', subEntryItem)
      await Promise.resolve(
        subEntryItem.isAds
          ? page.waitForXPath(tweetXPath.entryAds(subEntryItem.authorId, subEntryItem.entryId), {
              visible: true,
              timeout: 5000
            })
          : page.waitForSelector(tweetXPath.postCell(subEntryItem.authorId, subEntryItem.entryId), {
              visible: true,
              timeout: 5000
            })
      ).catch(() => {
        console.log('waitForEntryItemTimeout')
      })
      const elementHandle = await page
        .$x(
          subEntryItem.isAds
            ? tweetXPath.entryAds(subEntryItem.authorId, subEntryItem.entryId)
            : tweetXPath.postCell(subEntryItem.authorId, subEntryItem.entryId)
        )
        .then((res) => res[0])
      if (!elementHandle) {
        console.log('!elementHandle')
        continue
      }
      await scrollAction.scrollToEntry(page, elementHandle)
      await _getDelayTimeAction(featOptions)
      if (subEntryItem.isRePost || subEntryItem.isAds) {
        continue
      }
      const entryUrl = await elementHandle.$(
        commonPathSelector.entryUrl(subEntryItem.authorId, subEntryItem.entryId)
      )
      const username = subEntryItem.author.username
      const usernameUrls = await Promise.all([
        elementHandle.$(commonPathSelector.entryAvatarUserNameUrl(username)),
        elementHandle.$(commonPathSelector.entryUserNameUrl(username))
      ])
      const elementsHover = usernameUrls
      elementsHover.push(entryUrl)
      const elementHover = utils.random(elementsHover.filter(Boolean))
      if (elementHover) {
        await elementHover.hover()
        await utils.delayRandom()
        await page.mouse.reset()
      }
      await _getDelayTimeAction(featOptions)
      await scrollAction.scrollToEntryAction(page, elementHandle)
      await _getDelayTimeAction(featOptions)
      const funcActions = utils.shuffle(
        [
          utils.random(featOptions.allowCommentAction) &&
            !subEntryItem.limitedActions.reply &&
            account.chatOpenAIKey &&
            featOptions.chatOpenAIPrefix &&
            (() =>
              interactAction.commentEntryWithChatGPT(page, elementHandle, subEntryItem.fullText, {
                key: account.chatOpenAIKey,
                prefix: featOptions.chatOpenAIPrefix,
                maxRetryTime: 2
              })),
          utils.random(featOptions.allowLikeAction) &&
            !subEntryItem.limitedActions.like &&
            (() => interactAction.favoriteEntry(page, elementHandle))
        ].filter(Boolean)
      )
      for (let funcActionIndex = 0; funcActionIndex < funcActions.length; funcActionIndex++) {
        const funcAction = funcActions[funcActionIndex]
        await funcAction()
        await _getDelayTimeAction(featOptions)
      }
      if (callbackDoneEntry()) {
        console.log('newsFeed__home_close')
        return
      }
    }
  }
  console.log(`newsFeed__home_end`)
}
