import logger from '../logger'
import { mapErrorConstructor } from '../helpers'
import {
  TWEET_MEDIA_TYPE,
  UNIFIED_CARD_TYPE,
  DESTINATION_OBJECT_TYPES,
  ITEM_CONTENT_TYPE,
  ENTRY_TYPE
} from './constants'

const TWEET_RESULTS_TYPE_NAME = {
  tweet: 'Tweet',
  withVisibilityResults: 'TweetWithVisibilityResults',
  tombstone: 'TweetTombstone'
}

const TWEET_ACTION_TYPE = {
  reply: 'Reply',
  like: 'Like'
}

// const TIME_LINE_TYPE = {
//   module: "TimelineTimelineModule",
//   item: "TimelineTimelineItem",
// };

const mapUserTweet = (entry) => {
  try {
    if (!entry.content.itemContent?.tweet_results) {
      return
    }

    const tweetResultsTypeName = entry.content.itemContent?.tweet_results.result.__typename
    const isAds = !!entry.content.itemContent.promotedMetadata?.advertiser_results
    const isRePost =
      !!entry.content.itemContent?.tweet_results.result?.legacy?.retweeted_status_result ||
      !!entry.content.itemContent?.tweet_results.result?.tweet?.legacy?.retweeted_status_result
    const createdAt = entry.content.itemContent?.tweet_results.result?.legacy?.created_at
    const limitedActions = (
      entry.content.itemContent?.tweet_results.result?.limitedActionResults?.limited_actions || []
    ).reduce((result, limitedAction) => {
      switch (limitedAction.action) {
        case TWEET_ACTION_TYPE.like:
          result['like'] = true
          break
        case TWEET_ACTION_TYPE.reply:
          result['reply'] = true
          break
        default:
          break
      }
      return result
    }, {})

    const tweet =
      tweetResultsTypeName === TWEET_RESULTS_TYPE_NAME.withVisibilityResults
        ? entry.content.itemContent?.tweet_results.result.tweet
        : entry.content.itemContent?.tweet_results.result.legacy.retweeted_status_result
          ? entry.content.itemContent?.tweet_results.result.legacy.retweeted_status_result.result
          : entry.content.itemContent?.tweet_results.result

    const favorited = tweet.legacy.favorited
    const authorId = tweet.core.user_results.result.legacy.screen_name
    const entryId = tweet.rest_id
    const fullText = tweet.legacy.full_text
    const replyCount = tweet.legacy.reply_count

    const entities = { media: [], urls: [] }
    const unifiedCard = { media: [], urls: [] }

    if (isAds) {
      if (tweet.card?.legacy?.binding_values?.length) {
        const unifiedCardBindingValue = tweet.card.legacy.binding_values.find(
          (bindingValue) => bindingValue.key === 'unified_card'
        )
        if (unifiedCardBindingValue) {
          const unifiedCardBindingObject = JSON.parse(unifiedCardBindingValue.value.string_value)
          switch (unifiedCardBindingObject.type) {
            case UNIFIED_CARD_TYPE.videoWebsite:
              Object.values(unifiedCardBindingObject.media_entities).forEach((media) => {
                switch (media.type) {
                  case TWEET_MEDIA_TYPE.video:
                    unifiedCard.media.push({
                      type: media.type,
                      durationMilliseconds: media.video_info?.duration_millis
                    })
                    return
                  case TWEET_MEDIA_TYPE.photo:
                  default:
                    return
                }
              })
              break
            case UNIFIED_CARD_TYPE.imageWebsite:
            default:
              break
          }
          Object.values(unifiedCardBindingObject.destination_objects).forEach((destinationObj) => {
            switch (destinationObj.type) {
              case DESTINATION_OBJECT_TYPES.browser:
              case DESTINATION_OBJECT_TYPES.browserWithDockedMedia:
                unifiedCard.urls.push(destinationObj.data.url_data.url)
                break
              default:
                break
            }
          })
        }
      }
      if (tweet.legacy.entities?.media?.length) {
        tweet.legacy.entities.media.forEach((media) => {
          switch (media.type) {
            case TWEET_MEDIA_TYPE.video:
              entities.media.push({
                type: media.type,
                durationMilliseconds: media.video_info?.duration_millis
              })
              return
            case TWEET_MEDIA_TYPE.photo:
              entities.media.push({
                type: media.type,
                expandedUrl: media.expanded_url,
                mediaUrlHttps: media.media_url_https,
                url: media.url
              })
              return
            default:
              return
          }
        })
      }
      if (tweet.legacy.entities?.urls?.length) {
        tweet.legacy.entities?.urls.forEach((urlItem) => {
          entities.urls.push({
            displayUrl: urlItem.display_url,
            expandedUrl: urlItem.expanded_url,
            url: urlItem.url
          })
        })
      }
    }

    return {
      postId: entryId,
      authorProfileId: authorId,
      favorited,
      isAds,
      isRePost,
      limitedActions,
      fullText,
      replyCount,
      entities,
      unifiedCard,
      createdAt
    }
  } catch (error) {
    logger.error('MAP_POST_ENTRY_ERROR', {
      error: mapErrorConstructor(error),
      entry
    })
    return
  }
}

/**
 *
 * @param {{
 *   content: {
 *     items?: []
 *   }
 * }} entry
 */
const mapTweetDetail = (entry) => {
  const contentItems = entry.content.items || []
  if (entry.content.entryType === ENTRY_TYPE.item && entry.content.itemContent) {
    contentItems.push({ item: { itemContent: entry.content.itemContent } })
  }
  return contentItems
    .map((contentItem, index) => {
      try {
        if (contentItem.item.itemContent.itemType !== ITEM_CONTENT_TYPE.item) {
          return
        }
        const tweetResultsTypeName = contentItem.item.itemContent?.tweet_results.result.__typename
        const isAds = !!contentItem.item.itemContent.promotedMetadata?.advertiser_results
        const isReply =
          !!contentItem.item.itemContent?.tweet_results.result?.legacy?.retweeted_status_result ||
          !!contentItem.item.itemContent.tweet_results.result?.tweet?.legacy.retweeted_status_result

        const limitedActions = (
          contentItem.item.itemContent?.tweet_results.result?.limitedActionResults
            ?.limited_actions || []
        ).reduce((result, limitedAction) => {
          switch (limitedAction.action) {
            case TWEET_ACTION_TYPE.like:
              result['like'] = true
              break
            case TWEET_ACTION_TYPE.reply:
              result['reply'] = true
              break
            default:
              break
          }
          return result
        }, {})
        if (tweetResultsTypeName === TWEET_RESULTS_TYPE_NAME.tombstone) {
          return
        }
        const tweet =
          tweetResultsTypeName === TWEET_RESULTS_TYPE_NAME.withVisibilityResults
            ? contentItem.item.itemContent?.tweet_results.result.tweet
            : contentItem.item.itemContent?.tweet_results.result.legacy.retweeted_status_result
              ? contentItem.item.itemContent?.tweet_results.result.legacy.retweeted_status_result
                  .result
              : contentItem.item.itemContent?.tweet_results.result

        const favorited = tweet.legacy.favorited
        const authorId = tweet.core.user_results.result.legacy.screen_name
        const author = {
          profileId: tweet.core.user_results.result.rest_id,
          username: authorId,
          isBlueVerified: tweet.core.user_results.result.is_blue_verified,
          following: !!tweet.core.user_results.result.following
        }
        const entryId = tweet.rest_id
        const fullText = tweet.legacy.full_text

        const entities = { media: [], urls: [] }
        const unifiedCard = { media: [], urls: [] }

        if (isAds) {
          if (tweet.card?.legacy?.binding_values?.length) {
            const unifiedCardBindingValue = tweet.card.legacy.binding_values.find(
              (bindingValue) => bindingValue.key === 'unified_card'
            )
            if (unifiedCardBindingValue) {
              const unifiedCardBindingObject = JSON.parse(
                unifiedCardBindingValue.value.string_value
              )
              switch (unifiedCardBindingObject.type) {
                case UNIFIED_CARD_TYPE.videoWebsite:
                  Object.values(unifiedCardBindingObject.media_entities).forEach((media) => {
                    switch (media.type) {
                      case TWEET_MEDIA_TYPE.video:
                        unifiedCard.media.push({
                          type: media.type,
                          durationMilliseconds: media.video_info?.duration_millis
                        })
                        return
                      case TWEET_MEDIA_TYPE.photo:
                      default:
                        return
                    }
                  })
                  break
                case UNIFIED_CARD_TYPE.imageWebsite:
                default:
                  break
              }
              Object.values(unifiedCardBindingObject.destination_objects).forEach(
                (destinationObj) => {
                  switch (destinationObj.type) {
                    case DESTINATION_OBJECT_TYPES.browser:
                    case DESTINATION_OBJECT_TYPES.browserWithDockedMedia:
                      unifiedCard.urls.push(destinationObj.data.url_data.url)
                      break
                    default:
                      break
                  }
                }
              )
            }
          }
          if (tweet.legacy.entities?.media?.length) {
            tweet.legacy.entities.media.forEach((media) => {
              switch (media.type) {
                case TWEET_MEDIA_TYPE.video:
                  entities.media.push({
                    type: media.type,
                    durationMilliseconds: media.video_info?.duration_millis
                  })
                  return
                case TWEET_MEDIA_TYPE.photo:
                  entities.media.push({
                    type: media.type,
                    expandedUrl: media.expanded_url,
                    mediaUrlHttps: media.media_url_https,
                    url: media.url
                  })
                  return
                default:
                  return
              }
            })
          }
          if (tweet.legacy.entities?.urls?.length) {
            tweet.legacy.entities?.urls.forEach((urlItem) => {
              entities.urls.push({
                displayUrl: urlItem.display_url,
                expandedUrl: urlItem.expanded_url,
                url: urlItem.url
              })
            })
          }
        }

        return {
          entryId,
          authorId,
          author,
          favorited,
          isAds,
          isReply,
          limitedActions,
          fullText,
          entities,
          unifiedCard,
          entryMap: {
            index,
            entry
          }
        }
      } catch (error) {
        logger.error('MAP_COMMENT_ENTRY_ERROR', {
          error: mapErrorConstructor(error),
          index,
          entry
        })
        return
      }
    })
    .filter(Boolean)
}

const mapFollower = (entry) => {
  try {
    if (entry.content.entryType !== 'TimelineTimelineItem') {
      return
    }
    const entryItemContentResult = entry.content.itemContent.user_results.result
    const profileId = entryItemContentResult.rest_id
    const username = entryItemContentResult.legacy.screen_name
    const isBlueVerified = entryItemContentResult.is_blue_verified
    const following = !!entryItemContentResult.legacy.following
    return {
      profileId,
      username,
      isBlueVerified,
      following
    }
  } catch (error) {
    logger.error('MAP_FOLLOWER_ENTRY_ERROR', {
      error: mapErrorConstructor(error),
      entry
    })
    return
  }
}

export default {
  mapUserTweet,
  mapTweetDetail,
  mapFollower
}
