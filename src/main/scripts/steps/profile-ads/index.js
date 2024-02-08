import { mapErrorConstructor } from '../../../helpers'
import logger from '../../../logger'
// eslint-disable-next-line no-unused-vars
import { Browser, Account, InteractAdsOptions } from '../../define-type'
import profile from './profiles'
import { getProfileData } from '../../services/backend'
import { randomDelay } from '../../tasks/utils'

const dataMemories = {}

/**
 * @param {Browser} browser the Puppeteer Browser
 * @param {Account} account The Account
 * @param {InteractAdsOptions} featOptions The featOptions object
 */
const _func = async (page, profileGiver, profileReceiver, featOptions) => {
  dataMemories[profileGiver] = {}
  const profileGiverData = await getProfileData(profileGiver, {})
  const profileReceiverData = await getProfileData(profileReceiver, {})

  try {
    await profile(page, profileGiverData, featOptions, profileReceiverData)
  } catch (error) {
    logger.error('profileAds__LOOP_PROFILE_ERROR', {
      accountId: profileGiverData.username,
      error: mapErrorConstructor(error)
    })
  }
}

const init = _func

const stop = (profileId) => {
  clearTimeout(dataMemories[profileId])
  delete dataMemories[profileId]
}

export default {
  init,
  stop
}
