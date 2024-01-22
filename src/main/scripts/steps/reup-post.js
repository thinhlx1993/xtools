import puppeteer  from "puppeteer-core"
import {CronJob} from "cron"
import chatIntegration  from "../../integration/chat"
import repository  from "../../database/repository"
import logger  from "../../logger"
import store  from "../../store"
import { mapErrorConstructor }  from "../../helpers"
import { STORE_KEYS }  from "../../constants"
import { authenticateProxy }  from "../helpers"
import { TWEET_MEDIA_TYPE, PAGE_URL }  from "../constants"
import utils  from "../utils"
import { composeTweetPathSelector }  from "../path-selector"
import mapper  from "../mapper"

/**
 * @typedef {Object} FeatOptions
 * @property {string} profiles - The profiles in string.
 * @property {boolean} mixRandomProfiles - Enable mix.
 * @property {string} chatOpenAIPrefix
 * @property {boolean} reUpWithImage
 * @property {boolean} reUpWithVideo
 * @property {string} randomTotalPostsReUp
 * @property {string} timesReUp
 */

const getContentReUp = (chatOpenAIKey, content, tryTime = 0) => {
  if (tryTime > 50) {
    logger.error("WAIT_CHAT_GPT_RESPONSE_LONG_TIME");
    return;
  }
  return chatIntegration
    .getCompletion(chatOpenAIKey, content)
    .catch(async (error) => {
      logger.error("GET_CONTENT_RE_UP_ERROR", error?.error || error);
      await utils.delayRandom([3500, 4000, 4500, 5000, 5500]);
      return getContentReUp(chatOpenAIKey, content, tryTime + 1);
    });
};

/**
 * @type {Object.<string, Array<CronJob>>}
 */
const dataMemories = {};

/**
 * @param {puppeteer.Page} page
 * @param {{
 *   chatOpenAIKey: string;
 *   chatOpenAIPrefix: string;
 *   reUpWithImage: boolean;
 *   reUpWithVideo: boolean;
 * }} openAIConfig
 * @param {{id: number; profileId: string; entry: object}} twPost
 */
const _base = async (page, openAIConfig, twPost) => {
  const profileId = twPost.profileId;
  // console.log(`start reup post ${profileId}`);
  const oldestPost = JSON.parse(twPost.entry);
  try {
    /** */
    const reMapped = mapper.mapUserTweet(oldestPost);
    if (!reMapped || reMapped.isAds || reMapped.isRePost) {
      await repository.softDeletePostsReUp(twPost.id);
      return;
    }
    // prepare post
    const post = {
      legacy: {
        fullText: reMapped.fullText,
        extendedEntities: {
          media: (
            oldestPost.content.itemContent.tweet_results.result.legacy
              .extended_entities?.media || []
          )
            .filter((item) =>
              [TWEET_MEDIA_TYPE.photo, TWEET_MEDIA_TYPE.video].includes(
                item.type
              )
            )
            .map((item) => ({
              type: item.type,
              expandedUrl: item.expanded_url,
              mediaUrlHttps: item.media_url_https,
            })),
        },
        quotedStatusPermalink:
          oldestPost.content.itemContent.tweet_results.result.legacy
            .quoted_status_permalink,
      },
    };
    let contentInput = await getContentReUp(
      openAIConfig.chatOpenAIKey,
      `${openAIConfig.chatOpenAIPrefix} ${post.legacy.fullText}`
    );
    if (!contentInput) {
      return;
    }

    // ??
    if (
      post.legacy.quotedStatusPermalink?.expanded ||
      post.legacy.quotedStatusPermalink?.url
    ) {
      contentInput += `\n`;
      contentInput +=
        post.legacy.quotedStatusPermalink.expanded ||
        post.legacy.quotedStatusPermalink.url;
    }

    // hashtag trending
    const hashtagTrendingList = JSON.parse(
      store.get(STORE_KEYS.TRENDING_HASH_TAG) || "[]"
    );
    if (hashtagTrendingList.length) {
      const hashtagRandom = utils.random(hashtagTrendingList);
      contentInput += "\n";
      contentInput += `#${hashtagRandom.replace(/\s/g, "")}`;
      contentInput += " ";
    }

    // media link (image, video)
    post.legacy.extendedEntities.media.forEach((mediaItem) => {
      switch (mediaItem.type) {
        case TWEET_MEDIA_TYPE.video:
          if (!openAIConfig.reUpWithVideo) {
            return;
          }
          break;
        case TWEET_MEDIA_TYPE.gif:
        case TWEET_MEDIA_TYPE.photo:
          if (!openAIConfig.reUpWithImage) {
            return;
          }
          break;
        default:
          return;
      }
      contentInput += "\n";
      contentInput += mediaItem.expandedUrl;
    });

    // compose post
    await page.waitForSelector(composeTweetPathSelector.input, {
      visible: true,
      timeout: 15000,
    });
    await page.click(composeTweetPathSelector.input);
    await page.keyboard.sendCharacter(contentInput);
    await utils.delay();
    const submitBtn = await page.$(composeTweetPathSelector.submitBtn);
    if (!submitBtn) {
      return;
    }
    await submitBtn.hover();
    await utils.delayRandom();
    await submitBtn.click();
    await page.waitForSelector(composeTweetPathSelector.dialog, {
      visible: false,
      timeout: 5000,
    });
    await repository.softDeletePostsReUp(twPost.id);
    console.log("success");
  } catch (error) {
    logger.error("REUP_POST_ERROR", {
      error: mapErrorConstructor(error),
      id: twPost.id,
    });
  } finally {
    console.log(`reup post done ${profileId}`);
  }
};

/**
 *
 * @param {puppeteer.Browser} browser the Puppeteer Browser
 * @param {{
 *   id: number;
 *   proxy: string;
 *   chatOpenAIKey: string;
 * }} account The Account
 * @param {FeatOptions} featOptions The featOptions object
 */
const _func = async (browser, account, featOptions) => {
  console.log("startReUpPosts");
  if (!featOptions.chatOpenAIPrefix) {
    console.log("reUpPostsCancel");
    return;
  }
  const page = await browser.newPage();
  await authenticateProxy(page, account.proxy);
  const total = utils.randomArrayNumberInString(
    featOptions.randomTotalPostsReUp || "1,1"
  );
  console.log("totalPostsReUp", total);
  const posts = await repository.getPostsReUp(account.id, total);
  const postsLength = posts.length;
  for (let index = 0; index < postsLength; index++) {
    await page.goto(PAGE_URL.createPost, { waitUntil: "domcontentloaded" });
    const post = posts[index];
    await _base(
      page,
      {
        chatOpenAIKey: account.chatOpenAIKey,
        chatOpenAIPrefix: featOptions.chatOpenAIPrefix,
        reUpWithImage: featOptions.reUpWithImage,
        reUpWithVideo: featOptions.reUpWithVideo,
      },
      post
    );
    if (index === postsLength - 1) {
      continue;
    }
    await utils.delayRandom();
    // const randomDelayTimesReUp = utils.randomArrayNumberInString(
    //   featOptions.randomDelayTimesReUp
    // );
    // await utils.delay(randomDelayTimesReUp);
  }
  await page.close();
  console.log("reUpPostsSuccess");
};

/**
 *
 * @param {puppeteer.Browser} browser the Puppeteer Browser
 * @param {{
 *   id: number;
 *   proxy: string;
 *   chatOpenAIKey: string;
 * }} account The Account
 * @param {FeatOptions} featOptions The featOptions object
 */
const init = (browser, account, featOptions) => {
  const timesReUpPosts = featOptions.timesReUp.split(",");
  dataMemories[account.id] = timesReUpPosts
    .map((time) => {
      const [hour, minute] = time.split(":");
      if (hour && minute) {
        return new CronJob({
          cronTime: `0 ${minute} ${hour} * * *`,
          onTick: _func.bind(this, browser, account, featOptions),
          start: true,
          timeZone: "Asia/Ho_Chi_Minh",
        });
      }
      return;
    })
    .filter(Boolean);
};

const stop = (accountId) => {
  clearTimeout(dataMemories[accountId]);
  delete dataMemories[accountId];
};

export default {
  init,
  stop,
}
