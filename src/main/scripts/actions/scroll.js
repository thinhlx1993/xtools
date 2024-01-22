// const puppeteer = require("puppeteer-core");
import { commonPathSelector } from "../path-selector"
import { windowScrollBy } from "../helpers"
import utils from "../utils"

/**
 *
 * @param {puppeteer.Page} page
 * @param {puppeteer.ElementHandle} elementHandle
 */
const scrollToEntry = async (page, elementHandle) => {
  const [body, headerBarOfPrimaryColumn] = await Promise.all([
    page.$("body"),
    page.$(commonPathSelector.headerBarOfPrimaryColumn),
  ]);
  const [
    bodyBoundingBox,
    headerBarOfPrimaryColumnBoundingBox,
    elementBoundingBox,
  ] = await Promise.all([
    body.boundingBox(),
    headerBarOfPrimaryColumn.boundingBox(),
    elementHandle.boundingBox(),
  ]);

  const bodyHeight = bodyBoundingBox.height;
  const headerBarOfPrimaryColumnHeight =
    headerBarOfPrimaryColumnBoundingBox.height;
  const elementScrollY = elementBoundingBox.y;

  const positionOnScreen =
    (bodyHeight / 3) * utils.random([0.8, 0.9, 1, 1.1, 1.2]);
  const scrollHeightToMiddle =
    elementScrollY - headerBarOfPrimaryColumnHeight - positionOnScreen;
  await windowScrollBy(page, scrollHeightToMiddle);
};

/**
 *
 * @param {puppeteer.Page} page
 * @param {puppeteer.ElementHandle} elementHandle
 */
const scrollToEntryMedia = async (page, elementHandle) => {
  console.log("start__scrollToEntryMedia");
  const [body, headerBarOfPrimaryColumn, entryMedia] = await Promise.all([
    page.$("body"),
    page.$(commonPathSelector.headerBarOfPrimaryColumn),
    elementHandle.$(commonPathSelector.entryMedia),
  ]);
  const [bodyBoundingBox, headerBarOfPrimaryColumnBoundingBox, entryMediaBox] =
    await Promise.all([
      body.boundingBox(),
      headerBarOfPrimaryColumn.boundingBox(),
      entryMedia.boundingBox(),
    ]);

  const bodyHeight = bodyBoundingBox.height;
  const headerBarOfPrimaryColumnHeight =
    headerBarOfPrimaryColumnBoundingBox.height;
  const entryMediaBoxScrollY = entryMediaBox.y;

  const positionOnScreen =
    (bodyHeight / 4) * utils.random([0.8, 0.9, 1, 1.1, 1.2]);
  const scrollHeightToMiddle =
    entryMediaBoxScrollY - headerBarOfPrimaryColumnHeight - positionOnScreen;
    await windowScrollBy(page, scrollHeightToMiddle);
    console.log("done__scrollToEntryMedia");
};

/**
 *
 * @param {puppeteer.Page} page
 * @param {puppeteer.ElementHandle} elementHandle
 */
const scrollToEntryAction = async (page, elementHandle) => {
  const [body, headerBarOfPrimaryColumn, groupAction] = await Promise.all([
    page.$("body"),
    page.$(commonPathSelector.headerBarOfPrimaryColumn),
    elementHandle.$(commonPathSelector.entryGroupAction),
  ]);
  const [bodyBoundingBox, headerBarOfPrimaryColumnBoundingBox, groupActionBox] =
    await Promise.all([
      body.boundingBox(),
      headerBarOfPrimaryColumn.boundingBox(),
      groupAction.boundingBox(),
    ]);

  const bodyHeight = bodyBoundingBox.height;
  const headerBarOfPrimaryColumnHeight =
    headerBarOfPrimaryColumnBoundingBox.height;
  const groupActionBoxScrollY = groupActionBox.y;

  const positionOnScreen =
    (bodyHeight / 3) * utils.random([0.8, 0.9, 1, 1.1, 1.2]);
  const scrollHeightToMiddle =
    groupActionBoxScrollY - headerBarOfPrimaryColumnHeight - positionOnScreen;
  await windowScrollBy(page, scrollHeightToMiddle);
};

export default {
  scrollToEntry,
  scrollToEntryMedia,
  scrollToEntryAction,
}
