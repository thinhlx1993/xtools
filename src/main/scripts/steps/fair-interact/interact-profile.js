// import { Page, Account, FairInteractOptions } from "../../define-type"
import { handleResponseUserTweets } from "../../helpers"
import utils from "../../utils"
import mapper from "../../mapper"
import { tweetXPath } from "../../x-path"
import scrollAction from "../../actions/scroll"
import interactAction from "../../actions/interact"

/**
 *
 * @param {Page} page
 * @param {Account} account
 * @param {FairInteractOptions} featOptions
 */
export default async (page, account, featOptions) => {
  const entries = await new Promise((resolve) => {
    handleResponseUserTweets(page, ({ pinEntry, addEntries }) => {
      resolve(pinEntry ? [pinEntry] : addEntries);
    });
    setTimeout(() => resolve([]), 45000);
  });
  while (entries.length) {
    const entry = entries[0];
    entries.shift();
    const entryItem = mapper.mapUserTweet(entry);
    if (!entryItem) {
      continue;
    }
    if (entryItem.favorited) {
      return await utils.delayRandom([5500, 6500, 7000, 7500, 8000]);
    }
    const elementHandle = await page
      .$x(
        entryItem.isAds
          ? tweetXPath.entryAds(entryItem.authorProfileId, entryItem.postId)
          : tweetXPath.postCell(entryItem.authorProfileId, entryItem.postId)
      )
      .then((res) => res[0]);
    if (!elementHandle) {
      continue;
    }
    await scrollAction.scrollToEntry(page, elementHandle);
    await utils.delayRandom();
    if (entryItem.isAds || entryItem.isRePost) {
      console.log("entryItem.isAds || entryItem.isRePost", {
        isAds: entryItem.isAds,
        isRePost: entryItem.isRePost,
      });
      await utils.delayRandom([1000, 1500, 200]);
      continue;
    }
    await utils.delay(utils.randomArrayNumberInString("10,20") * 1000);
    await scrollAction.scrollToEntryAction(page, elementHandle);
    await utils.delayRandom();
    if (
      !entryItem.limitedActions.reply &&
      account.chatOpenAIKey &&
      featOptions.chatOpenAIPrefix
    ) {
      await interactAction.commentEntryWithChatGPT(
        page,
        elementHandle,
        entryItem.fullText,
        {
          key: account.chatOpenAIKey,
          prefix: featOptions.chatOpenAIPrefix,
          maxRetryTime: 2,
        }
      );
    }
    if (!entryItem.limitedActions?.reply) {
      await utils.delayRandom();
      await interactAction.favoriteEntry(page, elementHandle);
    }
    return await utils.delayRandom();
  }
};
