import { handleResponseTweetDetail } from '../../helpers'
import utils from '../../utils'
import mapper from '../../mapper'
import { commonPathSelector } from '../../path-selector'
import { tweetXPath } from '../../x-path'
import { ENTRY_TYPE, ITEM_CONTENT_TYPE } from '../../constants'
import scrollAction from '../../actions/scroll'
import navAction from '../../actions/nav'
import interactAction from '../../actions/interact'
import tweetDetailAction from '../../actions/tweet-detail'
import interactProfile from './interact-profile'
import logger from '../../../logger'

/**
 *
 * @param {Page} page
 * @param {Account} account
 * @param {FairInteractOptions} featOptions
 * @param {string[]} interactedUsername
 */
export default async (page, profileReceiverData, featOptions, interactedUsername) => {
  const entries = []

  handleResponseTweetDetail(page, ({ addEntries }) => {
    entries.push(...addEntries)
  })
  await Promise.all([
    page
      .waitForSelector(commonPathSelector.headingOfPrimaryColum, {
        visible: true,
        timeout: 30000
      })
      .catch(() => {}),
    page.waitForNavigation()
  ])
  await utils.delayRandom([5500, 6000, 6500, 7000])

  let entry = null
  if (entries.length > 0) {
    const randomIndex = Math.floor(Math.random() * entries.length)
    entry = entries[randomIndex]
  }

  if (!entry) {
    logger.info('not found entry comment')
    await utils.delayRandom()
    return
  }
  const entryType = entry.content.entryType
  if (
    entryType === ENTRY_TYPE.item &&
    entry.content.itemContent.itemType === ITEM_CONTENT_TYPE.cursor
  ) {
    logger.info('tweetDetailAction.clickViewMore')
    await utils.delayRandom()
    logger.info('tweetDetailAction.clickViewMore___2')
    await tweetDetailAction.clickViewMore(page)
    await utils.delayRandom()
  }
  const subEntryItems = mapper.mapTweetDetail(entry)

  let subEntryItem = null
  // Check if the array is not empty
  if (subEntryItems.length > 0) {
    const matchedItem = subEntryItems.find(
      (item) => item.authorId.toLowerCase() === profileReceiverData.username.toLowerCase()
    )
    if (matchedItem) {
      logger.info(`Found matched subEntryItem`)
      subEntryItem = matchedItem
    } else {
      logger.info(`Random subEntryItem`)
      // Generate a random index
      const randomIndex = Math.floor(Math.random() * subEntryItems.length)

      // Access the random element
      subEntryItem = subEntryItems[randomIndex]
    }

    const username = subEntryItem.authorId
    const getElementHandle = () =>
      page
        .$x(
          subEntryItem.isAds
            ? tweetXPath.entryAds(username, subEntryItem.entryId)
            : tweetXPath.postCell(username, subEntryItem.entryId)
        )
        .then((res) => res[0])
    let elementHandle = await getElementHandle()
    if (!elementHandle) {
      logger.info('!elementHandle')
      await utils.delayRandom()
      elementHandle = await getElementHandle()
      if (!elementHandle) {
        logger.info('!elementHandle__2')
        return
      }
    }
    await scrollAction.scrollToEntry(page, elementHandle)
    if (
      subEntryItem.isAds ||
      subEntryItem.isReply ||
      !subEntryItem.author.isBlueVerified ||
      subEntryItem.author.username === profileReceiverData.username ||
      interactedUsername.includes(username)
    ) {
      logger.info(
        'subEntryItem.isAds || subEntryItem.isReply || subEntryItem.author.isBlueVerified',
        {
          isAds: subEntryItem.isAds,
          isReply: subEntryItem.isReply,
          isBlueVerified: subEntryItem.author.isBlueVerified,
          isAuthor: subEntryItem.author.username === profileReceiverData.username,
          isIncluded: interactedUsername.includes(username)
        }
      )
      await scrollAction.scrollToEntryAction(page, elementHandle)
      await utils.delayRandom([500, 600, 700, 800, 1000])
      return
    }
    await utils.delay(utils.randomArrayNumberInString('30,50') * 100)
    const usernameUrls = await Promise.all([
      elementHandle.$(commonPathSelector.entryAvatarUserNameUrl(username)),
      elementHandle.$(commonPathSelector.entryUserNameUrl(username))
    ])
    const usernameUrl = utils.random(usernameUrls.filter(Boolean))
    if (!usernameUrl) {
      return
    }
    await usernameUrl.hover()
    await utils.delayRandom()
    await Promise.all([
      interactProfile(page, profileReceiverData, featOptions),
      usernameUrl.click().then(() => {
        page.mouse.reset()
      })
    ])
    interactedUsername.push(username)
    await Promise.all([page.waitForNavigation(), navAction.back(page)])
    elementHandle = await getElementHandle()
    if (elementHandle) {
      await utils.delayRandom()
      await scrollAction.scrollToEntryAction(page, elementHandle)
      await utils.delayRandom()
      if (!subEntryItem.favorited) {
        if (
          !subEntryItem.limitedActions.reply &&
          profileReceiverData.gpt_key &&
          featOptions.chatOpenAIPrefix
        ) {
          await utils.delayRandom()
          await interactAction.commentEntryWithChatGPT(page, elementHandle, subEntryItem.fullText, {
            key: profileReceiverData.gpt_key,
            prefix: featOptions.chatOpenAIPrefix,
            maxRetryTime: 2
          })
        }
        if (!subEntryItem.limitedActions?.reply) {
          await utils.delayRandom()
          await interactAction.favoriteEntry(page, elementHandle)
        }
      }
    }
    await utils.delayRandom()
  }
  // for (let index = 0; index < subEntryItems.length; index++) {
  // }
}
