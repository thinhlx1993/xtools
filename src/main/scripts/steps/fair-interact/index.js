import { mapErrorConstructor } from '../../../helpers'
import logger from '../../../logger'
import { authenticateProxy } from '../../helpers'
import { FAIR_INTERACT_OPTION } from '../../../constants'
// eslint-disable-next-line no-unused-vars
import { Browser, Account, FairInteractOptions } from '../../define-type'
import profileInteraction from './profile'
import detailInteraction from './detail'

const dataMemories = {}

/**
 * @param {Browser} browser the Puppeteer Browser
 * @param {Account} account The Account
 * @param {FairInteractOptions} featOptions The featOptions object
 */
const init = async (browser, account, featOptions) => {
  console.log('start fair interact func')
  dataMemories[account.id] = {}
  const page = await browser.newPage()
  await authenticateProxy(page, account.proxy)
  try {
    switch (featOptions.fairInteractOptions) {
      case FAIR_INTERACT_OPTION.totalPost:
        await profileInteraction(page, account, featOptions)
        break
      case FAIR_INTERACT_OPTION.entryUrl:
        await detailInteraction(page, account, featOptions)
        break
      default:
        break
    }
    console.log('fair interact done')
  } catch (error) {
    logger.error('FAIR_INTERACT_ERROR', {
      error: mapErrorConstructor(error),
      accountId: account.id
    })
  } finally {
    await page.close()
  }
}

const stop = (accountId) => {
  delete dataMemories[accountId]
}

export default {
  init,
  stop,
}
