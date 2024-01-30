import { PAGE_URL } from '../../constants'
import utils from '../../utils'
import { regHttp, regTwDomain, regXDomain, regParamEntryDetailUrl } from '../../regex'
import interact from './interact'
import logger from '../../../logger'

export default async (page, profileReceiverData, featOptions) => {
  const interactedUsername = []
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
      interact(page, profileReceiverData, featOptions, interactedUsername)
    ])
    await utils.delayRandom()
  }
}
