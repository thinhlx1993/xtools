import puppeteer from "puppeteer-core"
import { commonPathSelector } from "../path-selector"

/**
 *
 * @param {puppeteer.Page} page
 */
const back = async (page) => {
  const backBtn = await page.$(commonPathSelector.appBarBack);
  if (backBtn) {
    await backBtn.click();
    await page.mouse.reset();
    return;
  }
  return await page.goBack();
};

export default {
  back,
}
