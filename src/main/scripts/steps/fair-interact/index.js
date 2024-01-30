import { mapErrorConstructor } from '../../../helpers'
import logger from '../../../logger'
import { authenticateProxy } from '../../helpers'
import { FAIR_INTERACT_OPTION } from '../../../constants'
// eslint-disable-next-line no-unused-vars
import { Browser, Account, FairInteractOptions } from '../../define-type'
import profileInteraction from './profile'
import detailInteraction from './detail'
import { getProfileData } from '../../services/backend'

const dataMemories = {}

/**
 * @param {Browser} browser the Puppeteer Browser
 * @param {Account} account The Account
 * @param {FairInteractOptions} featOptions The featOptions object
 */
const init = async (page, profileGiver, profileReceiver, featOptions) => {
  const profileGiverData = await getProfileData(profileGiver, {})
  const profileReceiverData = await getProfileData(profileReceiver, {})
  logger.info(
    `start fair interact func ${profileGiverData.username} -> ${profileReceiverData.username}`
  )
  dataMemories[profileGiverData.profile_id] = {}
  await authenticateProxy(page, profileGiverData.proxy)
  try {
    switch (featOptions.fairInteractOptions) {
      case FAIR_INTERACT_OPTION.totalPost:
        await profileInteraction(page, profileReceiverData, featOptions)
        break
      case FAIR_INTERACT_OPTION.entryUrl:
        await detailInteraction(page, profileReceiverData, featOptions)
        break
      default:
        break
    }
    logger.info(
      `fair interact done ${profileGiverData.username} -> ${profileReceiverData.username}`
    )
  } catch (error) {
    logger.error('FAIR_INTERACT_ERROR', {
      error: mapErrorConstructor(error),
      profileId: profileGiver
    })
  } finally {
    await page.close()
  }
}

const stop = (profileId) => {
  delete dataMemories[profileId]
}

export default {
  init,
  stop
}
