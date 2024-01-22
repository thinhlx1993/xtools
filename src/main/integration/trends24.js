import puppeteer from 'puppeteer-core'
const DOMAIN = 'https://trends24.in'

/**
 * @param {string} browserExecutablePath
 * @param {string} region
 * @param {number} total
 * @return {Promise<string[]>}
 */
const getNewestTrends = async (browserExecutablePath, region = 'united-states', total) => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: browserExecutablePath,
    args: ['--disable-notifications', '--no-sandbox']
  })
  const page = await browser.newPage()
  await page.goto(`${DOMAIN}/${region}`)
  const trendingList = await page.$$eval(
    '#trend-list .trend-card:first-child .trend-card__list li',
    (elements) => elements.map((ele) => ele.title.replace('#', ''))
  )
  await browser.close()
  return trendingList.slice(0, total)
}

export default {
  getNewestTrends,
}
