export const DOMAIN_COOKIE = '.twitter.com'

export const PAGE_URL = {
  default: 'https://twitter.com',
  subpath: (subpath) => `https://twitter.com${subpath}`,
  login: 'https://twitter.com/i/flow/login',
  home: 'https://twitter.com/home',
  createPost: 'https://twitter.com/compose/tweet',
  profile: (profileId) => `https://twitter.com/${profileId}`
}

export const TWEET_INSTRUCTION_TYPE = {
  timeLineAdd: 'TimelineAddEntries',
  timeLinePin: 'TimelinePinEntry'
}

export const ENTRY_TYPE = {
  module: 'TimelineTimelineModule',
  item: 'TimelineTimelineItem'
}

export const ITEM_CONTENT_TYPE = {
  item: 'TimelineTweet',
  cursor: 'TimelineTimelineCursor'
}

export const TWEET_MEDIA_TYPE = {
  gif: 'animated_gif',
  photo: 'photo',
  video: 'video'
}

export const UNIFIED_CARD_TYPE = {
  imageWebsite: 'image_website',
  videoWebsite: 'video_website'
}

export const DESTINATION_OBJECT_TYPES = {
  browserWithDockedMedia: 'browser_with_docked_media',
  browser: 'browser'
}

// export const PROFILES_DEFAULTS = ["ai_whales_x", "XMakeMoneyWithX"];
