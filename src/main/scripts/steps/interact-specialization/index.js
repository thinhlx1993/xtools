import { mapErrorConstructor } from '../../../helpers'
import logger from '../../../logger'
import { authenticateProxy } from '../../helpers'
// eslint-disable-next-line no-unused-vars
import { Browser, Account, InteractSpecializationOptions } from '../../define-type'
import detailInteraction from './detail-interaction'

const dataMemories = {}

/**
 * @param {Browser} browser the Puppeteer Browser
 * @param {Account} account The Account
 * @param {InteractSpecializationOptions} featOptions The featOptions object
 */
const init = async (page, profileGiver, featOptions) => {
  console.log('interactSpecialization__init')
  dataMemories[profileGiver.profile_id] = {}
  await authenticateProxy(page, profileGiver.proxy)
  try {
    // const entryUrls = 'https://twitter.com/kaan_iskender'
    // await page.goto(entryUrls)
    await detailInteraction(page, profileGiver, featOptions)
    console.log('fair interact done')
  } catch (error) {
    if (!page.isClosed()) {
      logger.error('interactSpecialization__EXECUTE_FUNC_ERROR', {
        error: mapErrorConstructor(error),
        profileId: profileGiver.profile_id
      })
    }
  }
  console.log('interactSpecialization__closed')
}

const stop = (profileId) => {
  delete dataMemories[profileId]
}

export default {
  init,
  stop
}
