import { mapErrorConstructor } from '../../../helpers'
import logger from '../../../logger'
import { STOP_ACTION_OPTION } from '../../../constants'
import { authenticateProxy } from '../../helpers'
import utils from '../../utils'
// eslint-disable-next-line no-unused-vars
import { Browser, Account, NewsFeedOptions } from '../../define-type'
import home from './home'
import { randomDelay } from '../../tasks/utils'
import { getProfileData } from '../../services/backend'
const dataMemories = {}

/**
 * @param {Browser} browser the Puppeteer Browser
 * @param {Account} account The Account
 * @param {NewsFeedOptions} featOptions The featOptions object
 */
const _func = async (page, profileId, featOptions) => {
  const profileData = await getProfileData(profileId, {})
  await authenticateProxy(page, profileData.proxy)
  try {
    let totalPosts = 0
    let totalPostsToClose = undefined
    let timeToClose = false
    switch (featOptions.stopAction) {
      case STOP_ACTION_OPTION.timeout:
        setTimeout(() => {
          logger.info('Timeout newsfeed')
          timeToClose = true
        }, featOptions.stopActionTimeout * 60000)
        break
      case STOP_ACTION_OPTION.randomTotalPosts:
        totalPostsToClose = utils.randomArrayNumberInString(featOptions.stopActionRandomTotalPosts)
        break
      default:
        break
    }
    await randomDelay()
    await home(page, profileData, featOptions, () => {
      totalPosts += 1
      return (
        timeToClose || (typeof totalPostsToClose === 'number' && totalPosts === totalPostsToClose)
      )
    })
    await page.close()
  } catch (error) {
    if (!page.isClosed()) {
      logger.error('newsFeed__EXECUTE_FUNC_ERROR', {
        profileId: profileData.profile_id,
        error: mapErrorConstructor(error)
      })
    }
  }
}

const init = _func

const stop = (accountId) => {
  // clearTimeout(dataMemories[accountId])
  // delete dataMemories[accountId]
  logger.info(`stop ${accountId}`)
}

export default {
  init,
  stop
}
