import { mapErrorConstructor } from '../../../helpers'
import logger from '../../../logger'
import { STOP_ACTION_OPTION } from '../../../constants'
import { authenticateProxy } from '../../helpers'
import utils from '../../utils'
// eslint-disable-next-line no-unused-vars
import { Browser, Account, NewsFeedOptions } from '../../define-type'
import home from './home'

const dataMemories = {}

/**
 * @param {Browser} browser the Puppeteer Browser
 * @param {Account} account The Account
 * @param {NewsFeedOptions} featOptions The featOptions object
 */
const _func = async (browser, account, featOptions) => {
  const page = await browser.newPage()
  await authenticateProxy(page, account.proxy)
  try {
    let totalPosts = 0
    let totalPostsToClose = undefined
    let timeToClose = false
    switch (featOptions.stopAction) {
      case STOP_ACTION_OPTION.timeout:
        setTimeout(() => {
          timeToClose = true
        }, featOptions.stopActionTimeout * 60000)
        break
      case STOP_ACTION_OPTION.randomTotalPosts:
        totalPostsToClose = utils.randomArrayNumberInString(featOptions.stopActionRandomTotalPosts)
        break
      default:
        break
    }
    await home(page, account, featOptions, () => {
      totalPosts += 1
      return (
        timeToClose || (typeof totalPostsToClose === 'number' && totalPosts === totalPostsToClose)
      )
    })
    await page.close()
  } catch (error) {
    if (!page.isClosed()) {
      logger.error('newsFeed__EXECUTE_FUNC_ERROR', {
        accountId: account.id,
        error: mapErrorConstructor(error)
      })
    }
  }
  // if (dataMemories[account.id]) {
  //   if (
  //     featOptions.replayAction === REPLAY_ACTION_OPTION.timeout &&
  //     featOptions.replayActionTimeout > 0
  //   ) {
  //     dataMemories[account.id] = setTimeout(
  //       () => _func(browser, account, featOptions),
  //       featOptions.replayActionTimeout * 60000
  //     )
  //   }
  // }
}

const init = _func

const stop = (accountId) => {
  clearTimeout(dataMemories[accountId])
  delete dataMemories[accountId]
}

export default {
  init,
  stop,
}
