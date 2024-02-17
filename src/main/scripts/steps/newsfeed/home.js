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
import { randomDelay } from '../../tasks/utils'
/**
 *
 * @param {NewsFeedOptions} featOptions
 * @returns
 */
// const _getDelayTimeAction = (featOptions) =>
//   randomDelayByArrayNumberInString(featOptions.randomDelayTimeActions, {
//     unit: 'second'
//   })

/**
 *
 * @param {Page} page
 * @param {Account} account
 * @param {NewsFeedOptions} featOptions
 * @param {() => boolean} callbackDoneEntry
 */
export default async (page, profileData, featOptions, callbackDoneEntry) => {
  logger.info(`newsFeed__home_start`)
  const entries = []
  await randomDelay()
  handleResponseHomeTimeline(page, ({ addEntries }) => entries.push(...addEntries))
  await page.goto(PAGE_URL.home)
  logger.info(`done goto ${PAGE_URL.home}`)
  await page
    .waitForSelector(commonPathSelector.timelineSection, {
      visible: true,
      timeout: 30000
    })
    .catch(() => {
      logger.info('profileAds__WAIT_TIME_LINE_SECTION_TIMEOUT')
    })
  await randomDelay()
  logger.info(`done wait timeline section ${entries.length}`)
  while (entries.length) {
    const entry = entries[0]
    if (!entry) {
      logger.info('not found entry post')
      await randomDelay()
      return
    }
    logger.info(`process entry ${entry}`)
    entries.shift()
    const entryType = entry.content.entryType
    if (entryType === ENTRY_TYPE.module) {
      await windowScrollBy(page, 300)
      await randomDelay()
      continue
    }
    if (entryType !== ENTRY_TYPE.item) {
      continue
    }
    const subEntryItems = mapper.mapTweetDetail(entry)
    for (let index = 0; index < subEntryItems.length; index++) {
      const subEntryItem = subEntryItems[index]
      logger.info('subEntryItem', subEntryItem.authorId)
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
        logger.info('waitForEntryItemTimeout')
      })
      const elementHandle = await page
        .$x(
          subEntryItem.isAds
            ? tweetXPath.entryAds(subEntryItem.authorId, subEntryItem.entryId)
            : tweetXPath.postCell(subEntryItem.authorId, subEntryItem.entryId)
        )
        .then((res) => res[0])
      if (!elementHandle) {
        logger.info('!elementHandle')
        continue
      }
      await scrollAction.scrollToEntry(page, elementHandle)
      await randomDelay()
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
        await randomDelay()
        await page.mouse.reset()
      }
      await randomDelay()
      await scrollAction.scrollToEntryAction(page, elementHandle)
      // await randomDelay()
      // const funcActions = utils.shuffle(
      //   [
      //     utils.random(featOptions.allowCommentAction) &&
      //       !subEntryItem.limitedActions.reply &&
      //       profileData.gpt_key &&
      //       featOptions.chatOpenAIPrefix &&
      //       (() =>
      //         interactAction.commentEntryWithChatGPT(page, elementHandle, subEntryItem.fullText, {
      //           key: profileData.gpt_key,
      //           prefix: featOptions.chatOpenAIPrefix,
      //           maxRetryTime: 2
      //         })),
      //     utils.random(featOptions.allowLikeAction) &&
      //       !subEntryItem.limitedActions.like &&
      //       (() => interactAction.favoriteEntry(page, elementHandle))
      //   ].filter(Boolean)
      // )
      // for (let funcActionIndex = 0; funcActionIndex < funcActions.length; funcActionIndex++) {
      //   const funcAction = funcActions[funcActionIndex]
      //   await funcAction()
      //   await randomDelay()
      // }
      if (callbackDoneEntry()) {
        logger.info('newsFeed__home_close')
        return
      }
    }
  }
  logger.info(`newsFeed__home_end`)
}
