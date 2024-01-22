// const puppeteer = require('puppeteer-core')
import utils from '../utils'
import { tweetDetailPathSelector } from '../path-selector'

/**
 *
 * @param {puppeteer.Page} page
 */
const clickViewMore = async (page) => {
  console.log('clickViewMore')
  const progressBar = await page.$(tweetDetailPathSelector.progressBar)
  if (progressBar) {
    console.log('is_loading')
    await utils.delayRandom()
    return
  }
  const showMoreRepliesButton = await page.$(tweetDetailPathSelector.showMoreRepliesButton)
  if (showMoreRepliesButton) {
    console.log('showMoreRepliesButton__found')
    await showMoreRepliesButton.click()
    console.log('showMoreRepliesButton__click')
    await page
      .waitForSelector(tweetDetailPathSelector.showMoreRepliesButton, {
        visible: false,
        timeout: 30000
      })
      .catch((error) => {
        console.log('WAIT_showMoreRepliesButton_TIMEOUT', error)
        return null
      })
    console.log('showMoreRepliesButton___waitClosed')
  }
  if (!showMoreRepliesButton) {
    console.log('showMoreRepliesButton__notFound')
    const showAdditionalRepliesButton = await page.$(
      tweetDetailPathSelector.showAdditionalRepliesButton
    )
    if (showAdditionalRepliesButton) {
      console.log('showAdditionalRepliesButton__found')
      await showAdditionalRepliesButton.click()
      await page
        .waitForSelector(tweetDetailPathSelector.showAdditionalRepliesButton, {
          visible: false,
          timeout: 30000
        })
        .catch((error) => {
          console.log('WAIT_showAdditionalRepliesButton_TIMEOUT', error)
          return null
        })
    } else {
      console.log('showAdditionalRepliesButton__notFound')
    }
  }
  await utils.delayRandom()
  console.log('clickViewMore__done')
}

export default {
  clickViewMore,
}
