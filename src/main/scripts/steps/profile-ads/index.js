import { mapErrorConstructor } from '../../../helpers'
import logger from '../../../logger'
import { REPLAY_ACTION_OPTION } from '../../../constants'
import { authenticateProxy } from '../../helpers'
import utils from '../../utils'
// eslint-disable-next-line no-unused-vars
import { Browser, Account, InteractAdsOptions } from '../../define-type'
import profile from './profiles'

const dataMemories = {}

/**
 * @param {Browser} browser the Puppeteer Browser
 * @param {Account} account The Account
 * @param {InteractAdsOptions} featOptions The featOptions object
 */
const _func = async (browser, account, featOptions) => {
  dataMemories[account.id] = {}
  const page = await browser.newPage()
  await authenticateProxy(page, account.proxy)
  let profileIds = featOptions.profiles
    .split('\n')
    .map((profileId) => profileId.trim())
    .filter(Boolean)
  if (featOptions.mixRandomProfiles) {
    profileIds = utils.shuffle(profileIds)
  }
  try {
    for (let index = 0; index < profileIds.length; index++) {
      try {
        const profileId = profileIds[index]
        await profile(page, account, featOptions, profileId)
      } catch (error) {
        if (page.isClosed()) {
          break
        }
        logger.error('profileAds__LOOP_PROFILE_ERROR', {
          accountId: account.id,
          error: mapErrorConstructor(error)
        })
      } finally {
        await utils.delayRandomByArrayNumberInString(featOptions.randomDelayTimeProfiles, {
          unit: 'second'
        })
      }
    }
    await page.close()
  } catch (error) {
    if (!page.isClosed()) {
      logger.error('profileAds__EXECUTE_FUNC_ERROR', {
        accountId: account.id,
        error: mapErrorConstructor(error)
      })
    }
  }
  if (dataMemories[account.id]) {
    if (
      featOptions.replayAction === REPLAY_ACTION_OPTION.timeout &&
      featOptions.replayActionTimeout > 0
    ) {
      dataMemories[account.id] = setTimeout(
        () => _func(browser, account, featOptions),
        featOptions.replayActionTimeout * 10
      )
    }
  }
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
