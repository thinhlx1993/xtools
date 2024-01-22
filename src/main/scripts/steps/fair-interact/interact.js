import { handleResponseTweetDetail } from "../../helpers"
import utils from "../../utils"
import mapper from "../../mapper"
import { commonPathSelector } from "../../path-selector"
import { tweetXPath } from "../../x-path"
import { ENTRY_TYPE, ITEM_CONTENT_TYPE } from "../../constants"
import { Page, Account, FairInteractOptions } from "../../define-type"
import scrollAction from "../../actions/scroll"
import navAction from "../../actions/nav"
import interactAction from "../../actions/interact"
import tweetDetailAction from "../../actions/tweet-detail"
import interactProfile from "./interact-profile"

/**
 *
 * @param {Page} page
 * @param {Account} account
 * @param {FairInteractOptions} featOptions
 * @param {string[]} interactedUsername
 */
export default async (page, account, featOptions, interactedUsername) => {
  const entries = [];

  handleResponseTweetDetail(page, ({ addEntries }) => {
    entries.push(...addEntries);
  });
  await Promise.all([
    page
      .waitForSelector(commonPathSelector.headingOfPrimaryColum, {
        visible: true,
        timeout: 30000,
      })
      .catch(() => {}),
    page.waitForNavigation(),
  ]);
  await utils.delayRandom([5500, 6000, 6500, 7000]);

  while (entries) {
    const entry = entries[0];
    if (!entry) {
      console.log("not found entry comment");
      await utils.delayRandom();
      return;
    }
    entries.shift();
    const entryType = entry.content.entryType;
    if (
      entryType === ENTRY_TYPE.item &&
      entry.content.itemContent.itemType === ITEM_CONTENT_TYPE.cursor
    ) {
      console.log("tweetDetailAction.clickViewMore");
      await utils.delayRandom();
      console.log("tweetDetailAction.clickViewMore___2");
      await tweetDetailAction.clickViewMore(page);
      await utils.delayRandom();
    }
    const subEntryItems = mapper.mapTweetDetail(entry);
    for (let index = 0; index < subEntryItems.length; index++) {
      const subEntryItem = subEntryItems[index];
      const username = subEntryItem.authorId;
      const getElementHandle = () =>
        page
          .$x(
            subEntryItem.isAds
              ? tweetXPath.entryAds(username, subEntryItem.entryId)
              : tweetXPath.postCell(username, subEntryItem.entryId)
          )
          .then((res) => res[0]);
      let elementHandle = await getElementHandle();
      if (!elementHandle) {
        console.log("!elementHandle");
        await utils.delayRandom();
        elementHandle = await getElementHandle();
        if (!elementHandle) {
          console.log("!elementHandle__2");
          continue;
        }
      }
      await scrollAction.scrollToEntry(page, elementHandle);
      if (
        subEntryItem.isAds ||
        subEntryItem.isReply ||
        !subEntryItem.author.isBlueVerified ||
        subEntryItem.author.username === account.screenName ||
        interactedUsername.includes(username)
      ) {
        console.log(
          "subEntryItem.isAds || subEntryItem.isReply || subEntryItem.author.isBlueVerified",
          {
            isAds: subEntryItem.isAds,
            isReply: subEntryItem.isReply,
            isBlueVerified: subEntryItem.author.isBlueVerified,
            isAuthor: subEntryItem.author.username === account.screenName,
            isIncluded: interactedUsername.includes(username),
          }
        );
        await scrollAction.scrollToEntryAction(page, elementHandle);
        await utils.delayRandom([500, 600, 700, 800, 1000]);
        continue;
      }
      await utils.delay(utils.randomArrayNumberInString("30,50") * 100);
      const usernameUrls = await Promise.all([
        elementHandle.$(commonPathSelector.entryAvatarUserNameUrl(username)),
        elementHandle.$(commonPathSelector.entryUserNameUrl(username)),
      ]);
      const usernameUrl = utils.random(usernameUrls.filter(Boolean));
      if (!usernameUrl) {
        continue;
      }
      await usernameUrl.hover();
      await utils.delayRandom();
      await Promise.all([
        interactProfile(page, account, featOptions),
        usernameUrl.click().then(() => {
          page.mouse.reset();
        }),
      ]);
      interactedUsername.push(username);
      await Promise.all([page.waitForNavigation(), navAction.back(page)]);
      elementHandle = await getElementHandle();
      if (elementHandle) {
        await utils.delayRandom();
        await scrollAction.scrollToEntryAction(page, elementHandle);
        await utils.delayRandom();
        if (!subEntryItem.favorited) {
          if (
            !subEntryItem.limitedActions.reply &&
            account.chatOpenAIKey &&
            featOptions.chatOpenAIPrefix
          ) {
            await utils.delayRandom();
            await interactAction.commentEntryWithChatGPT(
              page,
              elementHandle,
              subEntryItem.fullText,
              {
                key: account.chatOpenAIKey,
                prefix: featOptions.chatOpenAIPrefix,
                maxRetryTime: 2,
              }
            );
          }
          if (!subEntryItem.limitedActions?.reply) {
            await utils.delayRandom();
            await interactAction.favoriteEntry(page, elementHandle);
          }
        }
      }
      await utils.delayRandom();
    }
  }
};
