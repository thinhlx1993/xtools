import { PAGE_URL } from '../../constants'
import utils from '../../utils'
import { Page, Account, InteractSpecializationOptions } from '../../define-type'
import { regHttp, regTwDomain, regXDomain, regParamEntryDetailUrl } from '../../regex'
import interact from './interact'

/**
 *
 * @param {Page} page
 * @param {Account} account
 * @param {InteractSpecializationOptions} featOptions
 */
export default async (page, account, featOptions) => {
  let entryUrls = featOptions.entryDetailUrls
    .split('\n')
    .map((url) => {
      let newUrl = url.trim()
      if (regHttp.test(newUrl) && !regTwDomain.test(newUrl) && !regXDomain.test(newUrl)) {
        return
      }
      const result = newUrl.match(regParamEntryDetailUrl)
      return result ? `/${result[0]}` : undefined
    })
    .filter(Boolean)
  if (featOptions.mixRandomEntryDetailUrls) {
    entryUrls = utils.shuffle(entryUrls)
  }
  for (let index = 0; index < entryUrls.length; index++) {
    await Promise.all([
      page.goto(PAGE_URL.subpath(entryUrls[index])),
      interact(page, account, featOptions)
    ])
    await utils.delayRandom()
  }
  // await page.goto(PAGE_URL.subpath(entryUrls))
  // await interact(page, account, featOptions)
}
