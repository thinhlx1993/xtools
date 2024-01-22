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
const init = async (browser, account, featOptions) => {
  console.log('interactSpecialization__init')
  dataMemories[account.id] = {}
  const page = await browser.newPage()
  await authenticateProxy(page, account.proxy)
  try {
    await detailInteraction(page, account, featOptions)
    await page.close()
    console.log('fair interact done')
  } catch (error) {
    if (!page.isClosed()) {
      logger.error('interactSpecialization__EXECUTE_FUNC_ERROR', {
        error: mapErrorConstructor(error),
        accountId: account.id
      })
    }
  }
  console.log('interactSpecialization__closed')
}

const stop = (accountId) => {
  delete dataMemories[accountId]
}

export default {
  init,
  stop,
}
