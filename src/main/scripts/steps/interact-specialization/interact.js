import { handleResponseTweetDetail } from "../../helpers"
import utils from "../../utils"
import mapper from "../../mapper"
import { commonPathSelector } from "../../path-selector"
import { tweetXPath } from "../../x-path"
import { ENTRY_TYPE } from "../../constants"
import { Page, Account, InteractSpecializationOptions } from "../../define-type"
import scrollAction from "../../actions/scroll"
import interactAction from "../../actions/interact"

/**
 *
 * @param {NewsFeedOptions} featOptions
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
 * @param {InteractSpecializationOptions} featOptions
 */
export default async (page, account, featOptions) => {
  const entries = [];
  handleResponseTweetDetail(page, ({ addEntries }) =>
    entries.push(...addEntries)
  );
  await Promise.all([
    page
      .waitForSelector(commonPathSelector.timelineSection, {
        visible: true,
        timeout: 30000,
      })
      .catch(() => {}),
    page.waitForNavigation(),
  ]);
  await utils.delayRandom([5500, 6000, 6500, 7000]);
  const entry = entries[0];
  if (!entry) {
    console.log("not found entry comment");
    await utils.delayRandom();
    return;
  }
  const entryType = entry.content.entryType;
  if (entryType !== ENTRY_TYPE.item) {
    return;
  }
  const subEntryItems = mapper.mapTweetDetail(entry);
  if (!subEntryItems.length) {
    console.log("subEntryItems isEmpty");
    return;
  }
  const subEntryItem = subEntryItems[0];
  const username = subEntryItem.authorId;
  const entryXpath = tweetXPath.postCell(username, subEntryItem.entryId);
  await page.waitForXPath(entryXpath, { timeout: 10000 }).catch((error) => {
    console.log("wait_error", error);
  });
  const elementHandle = await page.$x(entryXpath).then((res) => res[0]);
  if (!elementHandle) {
    console.log("!elementHandle");
    return;
  }
  await scrollAction.scrollToEntry(page, elementHandle);
  if (subEntryItem.isAds || subEntryItem.isReply) {
    return await _getDelayTimeAction(featOptions);
  }
  await _getDelayTimeAction(featOptions);
  const usernameUrls = await Promise.all([
    elementHandle.$(commonPathSelector.entryAvatarUserNameUrl(username)),
    elementHandle.$(commonPathSelector.entryUserNameUrl(username)),
  ]);
  const usernameUrl = utils.random(usernameUrls.filter(Boolean));
  if (usernameUrl) {
    await usernameUrl.hover();
    await utils.delayRandom();
    await page.mouse.reset();
  }
  await scrollAction.scrollToEntryAction(page, elementHandle);
  await _getDelayTimeAction(featOptions);
  const funcActions = utils.shuffle(
    [
      utils.random(featOptions.allowCommentAction) &&
        !subEntryItem.limitedActions.reply &&
        account.chatOpenAIKey &&
        featOptions.chatOpenAIPrefix &&
        (() =>
          interactAction.commentEntryWithChatGPT(
            page,
            elementHandle,
            subEntryItem.fullText,
            {
              key: account.chatOpenAIKey,
              prefix: featOptions.chatOpenAIPrefix,
              maxRetryTime: 2,
            }
          )),
      utils.random(featOptions.allowLikeAction) &&
        !subEntryItem.limitedActions.like &&
        (() => interactAction.favoriteEntry(page, elementHandle)),
    ].filter(Boolean)
  );
  for (
    let funcActionIndex = 0;
    funcActionIndex < funcActions.length;
    funcActionIndex++
  ) {
    const funcAction = funcActions[funcActionIndex];
    await funcAction();
    await _getDelayTimeAction(featOptions);
  }
};
