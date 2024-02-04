import { handleResponseTweetDetail, windowScrollByToTop } from '../../helpers'
import utils from '../../utils'
import mapper from '../../mapper'
import { tweetXPath } from '../../x-path'
import { ENTRY_TYPE, ITEM_CONTENT_TYPE } from '../../constants'
import scrollAction from '../../actions/scroll'
import interactAction from '../../actions/interact'
import tweetDetailAction from '../../actions/tweet-detail'
import logger from '../../../logger'
import { createEventLogs } from '../../services/backend'
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
 * @param {{
 *   entryId: string;
 *   username: string;
 *   limitedActions?: {
 *     like?: boolean;
 *   }
 *  fullText: string;
 * }} postEntry
 */
export default async (page, giverData, receiverData, featOptions, postEntry) => {
  logger.info(`${giverData.username} start view post detail`)
  const entries = []
  let adsInteracted = false
  handleResponseTweetDetail(page, ({ addEntries }) => {
    entries.push(...addEntries)
  })
  await new Promise((resolve) => {
    handleResponseTweetDetail(page, async () => {
      await utils.delayRandomByArrayNumberInString('3000,5000')
      resolve(false)
    })
    utils.delayRandomByArrayNumberInString('30,40', { unit: 'second' }).then(() => resolve(true))
  })
  while (entries) {
    const entry = entries[0]
    if (!entry) {
      logger.info('not found entry comment')
      await utils.delayRandom()
      return
    }
    entries.shift()
    const entryType = entry.content.entryType
    if (
      entryType === ENTRY_TYPE.item &&
      entry.content.itemContent.itemType === ITEM_CONTENT_TYPE.cursor
    ) {
      if (entries.length) {
        logger.info('skip cursor view more')
      } else {
        await utils.delayRandom()
        await tweetDetailAction.clickViewMore(page)
        await utils.delayRandom()
      }
    }
    const subEntryItems = mapper.mapTweetDetail(entry)
    for (let index = 0; index < subEntryItems.length; index++) {
      await page.bringToFront()
      const subEntryItem = subEntryItems[index]
      // logger.info('subEntryItem', subEntryItem)
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
        await utils.delayRandom()
        elementHandle = await getElementHandle()
        if (!elementHandle) {
          continue
        }
      }
      await scrollAction.scrollToEntry(page, elementHandle)
      await _getDelayTimeAction(featOptions)

      if (subEntryItem.isAds && Math.random() < 0.33) {
        await scrollAction.scrollToEntryMedia(page, elementHandle)
        await _getDelayTimeAction(featOptions)
        await createEventLogs({
          event_type: 'clickAds',
          profile_id: receiverData.profile_id,
          profile_id_interact: giverData.profile_id,
          issue: 'OK'
        })
        await interactAction.interactAdsEntry(page, elementHandle, subEntryItem)
        logger.info(`interactAdsEntry OK from ${giverData.username} -> ${receiverData.username}`)
        await page.mouse.reset()
        adsInteracted = true
      }
      elementHandle = await getElementHandle()
      if (elementHandle) {
        await scrollAction.scrollToEntryAction(page, elementHandle)
      }
    }
  }
  await _getDelayTimeAction(featOptions)
  if (!adsInteracted) {
    return
  }
  await windowScrollByToTop(page)
  const postElement = await page.$(tweetXPath.postCell(postEntry.username, postEntry.entryId))
  if (!postElement) {
    return
  }
  logger.info(`${giverData.username} end view post detail`)
}
