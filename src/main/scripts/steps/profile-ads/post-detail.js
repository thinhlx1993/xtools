import {
  handleResponseTweetDetail,
  windowScrollByToTop,
} from "../../helpers"
import utils from "../../utils"
import mapper from "../../mapper"
import { tweetXPath } from "../../x-path"
import { ENTRY_TYPE, ITEM_CONTENT_TYPE } from "../../constants"
import { Page, Account, InteractAdsOptions } from "../../define-type"
import scrollAction from "../../actions/scroll"
import interactAction from "../../actions/interact"
import tweetDetailAction from "../../actions/tweet-detail"

/**
 *
 * @param {InteractAdsOptions} featOptions
 * @returns
 */
const _getDelayTimeAction = (featOptions) =>
  utils.delayRandomByArrayNumberInString(featOptions.randomDelayTimeActions, {
    unit: "second",
  });

/**
 *
 * @param {Page} page
 * @param {Account} account
 * @param {InteractAdsOptions} featOptions
 * @param {{
 *   entryId: string;
 *   username: string;
 *   limitedActions?: {
 *     like?: boolean;
 *   }
 *  fullText: string;
 * }} postEntry
 */
export default async (page, account, featOptions, postEntry) => {
  console.log(`start view post detail ${account.id}`);
  const entries = [];
  let adsInteracted = false;
  handleResponseTweetDetail(page, ({ addEntries }) => {
    entries.push(...addEntries);
  });
  await new Promise((resolve) => {
    handleResponseTweetDetail(page, async () => {
      await utils.delayRandomByArrayNumberInString("3000,5000");
      resolve(false);
    });
    utils
      .delayRandomByArrayNumberInString("30,40", { unit: "second" })
      .then(() => resolve(true));
  });
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
      if (entries.length) {
        console.log("skip cursor view more");
      } else {
        await utils.delayRandom();
        await tweetDetailAction.clickViewMore(page);
        await utils.delayRandom();
      }
    }
    const subEntryItems = mapper.mapTweetDetail(entry);
    for (let index = 0; index < subEntryItems.length; index++) {
      const subEntryItem = subEntryItems[index];
      console.log("subEntryItem", subEntryItem);
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
        console.log("!elementHandle__first");
        await utils.delayRandom();
        elementHandle = await getElementHandle();
        if (!elementHandle) {
          console.log("!elementHandle__second");
          continue;
        }
      }
      await scrollAction.scrollToEntry(page, elementHandle);
      await _getDelayTimeAction(featOptions);
      console.log("done_waitAfter_scrollToEntry");
      if (subEntryItem.isAds) {
        await scrollAction.scrollToEntryMedia(page, elementHandle);
        await _getDelayTimeAction(featOptions);
        await interactAction.interactAdsEntry(
          page,
          elementHandle,
          subEntryItem
        );
        await page.mouse.reset();
        adsInteracted = true;
      }
      elementHandle = await getElementHandle();
      if (elementHandle) {
        await scrollAction.scrollToEntryAction(page, elementHandle);
      }
    }
  }
  await _getDelayTimeAction(featOptions);
  if (!adsInteracted) {
    return;
  }
  await windowScrollByToTop(page);
  const postElement = await page.$(
    tweetXPath.postCell(postEntry.username, postEntry.entryId)
  );
  if (!postElement) {
    return;
  }
  // const funcActions = utils.shuffle(
  //   [
  //     utils.random(featOptions.allowCommentAction || []) &&
  //       !postEntry.limitedActions.reply &&
  //       account.chatOpenAIKey &&
  //       featOptions.chatOpenAIPrefix &&
  //       (() =>
  //         interactAction.commentEntryWithChatGPT(
  //           page,
  //           postElement,
  //           postEntry.fullText,
  //           {
  //             key: account.chatOpenAIKey,
  //             prefix: featOptions.chatOpenAIPrefix,
  //             maxRetryTime: 2,
  //           }
  //         )),
  //     utils.random(featOptions.allowLikeAction || []) &&
  //       !postEntry.limitedActions.like &&
  //       (() => interactAction.favoriteEntry(page, postElement)),
  //   ].filter(Boolean)
  // );
  // for (
  //   let funcActionIndex = 0;
  //   funcActionIndex < funcActions.length;
  //   funcActionIndex++
  // ) {
  //   const funcAction = funcActions[funcActionIndex];
  //   await _getDelayTimeAction(featOptions);
  //   await funcAction();
  // }
  console.log(`end view post detail ${account.id}`);
};
