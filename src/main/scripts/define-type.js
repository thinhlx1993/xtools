import puppeteer from 'puppeteer-core'

/**
 * @typedef {puppeteer.Browser} Browser
 */

/**
 * @typedef {puppeteer.Page} Page
 */

/**
 * @typedef {Object} ScriptOption
 * @property {BrowserOption} browser
 */

/**
 * @typedef {Object} BrowserOption
 * @property {'chrome' | 'hideMyAcc'} browserOption
 * @property {{
 *   browserExecutablePath: string;
 * }} chrome
 * @property {HideMyAcc} hideMyAcc
 */

/**
 * @typedef {Object} HideMyAcc
 * @property {string} browserExecutablePath
 * @property {string} browserVersion
 * @property {string} apiRoot
 * @property {string} username
 * @property {string} password
 */

/**
 * @typedef {Object} Account
 * @property {number} id
 * @property {string} profileId - EntryId
 * @property {string} screenName - Username
 * @property {string} displayName - Display name
 * @property {string | null} proxy
 * @property {string} chatOpenAIKey
 * @property {string} browserProfileName
 * @property {string} hideMyAccUsername
 * @property {string} hideMyAccProfileDir
 * @property {string} hideMyAccProfileId
 */

/**
 * @typedef {Object} FairInteractOptions
 * @property {'totalPost' | 'entryUrl' | null} fairInteractOptions - Type of location for fair interact (user's profile/entry url)
 * @property {string} entryDetailUrls - Entry urls detail
 * @property {boolean} mixRandomEntryDetailUrls - Mix entry url
 * @property {number} totalPosts - Total number posts of profile.
 * @property {string} chatOpenAIPrefix - Chat GPTPrefix
 */

/**
 * @typedef {Object} InteractAdsOptions
 * @property {string} profiles - String array profiles
 * @property {boolean} mixRandomProfiles - Mix profiles
 * @property {'off' | 'timeout'} replayAction
 * @property {number} replayActionTimeout
 * @property {(true|false)[]} allowLikeAction
 * @property {(true|false)[]} allowCommentAction
 * @property {string} chatOpenAIPrefix - Chat GPTPrefix
 * @property {string} randomTotalPostsForInteractAds - Total number posts of profile.
 * @property {string} randomDelayTimeProfiles - Delay time for changing profiles
 * @property {string} randomDelayTimeActions - Delay time for changing actions
 */

/**
 * @typedef {Object} NewsFeedOptions
 * @property {'off' | 'timeout'} replayAction
 * @property {number} replayActionTimeout
 * @property {'timeout' | 'randomTotalPosts'} stopAction
 * @property {number} stopActionTimeout
 * @property {string} stopActionRandomTotalPosts
 * @property {string} randomDelayTimeActions
 * @property {(true|false)[]} allowLikeAction
 * @property {(true|false)[]} allowCommentAction
 * @property {string} chatOpenAIPrefix
 */

/**
 * @typedef {Object} InteractSpecializationOptions
 * @property {string} entryDetailUrls
 * @property {boolean} mixRandomEntryDetailUrls
 * @property {string} randomDelayTimeActions
 * @property {(true|false)[]} allowLikeAction
 * @property {(true|false)[]} allowCommentAction
 * @property {string} chatOpenAIPrefix
 */
