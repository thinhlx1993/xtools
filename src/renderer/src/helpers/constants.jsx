export const hideMyAccAPIRoot = 'https://api-tuan.hidemyacc.com'

export const MAXIMUM_ADD_MULTI_ACC = 10

export const BROWSER_TYPE = {
  chrome: 'chrome',
  hideMyAcc: 'hideMyAcc'
}

export const BROWSER_OPTIONS = [
  { label: 'Chrome', value: BROWSER_TYPE.chrome },
  { label: 'HideMyAcc', value: BROWSER_TYPE.hideMyAcc }
]

export const FEATURE_TYPE = {
  reUpPost: 'reUpPost',
  interactAds: 'interactAds',
  followProfiles: 'followProfiles',
  buffViews: 'buffViews',
  fairInteract: 'fairInteract',
  newsFeed: 'newsFeed',
  interactSpecialization: 'interactSpecialization'
}

export const REPLAY_ACTION_OPTION = {
  off: 'off',
  timeout: 'timeout'
}

export const STOP_ACTION_OPTION = {
  timeout: 'timeout',
  randomTotalPosts: 'randomTotalPosts'
}

export const FAIR_INTERACT_OPTION = {
  totalPost: 'totalPost',
  entryUrl: 'entryUrl'
}

export const FAIR_INTERACT_OPTIONS = [
  {
    label: 'Số bài đăng đầu tiên',
    value: FAIR_INTERACT_OPTION.totalPost
  },
  {
    label: 'Đường dẫn bài viết chỉ định',
    value: FAIR_INTERACT_OPTION.entryUrl
  }
]

export const ACCOUNT_SETTING_DEFAULT = {
  cookie: '',
  proxy: '',
  note: '',
  chatOpenAIKey: '',
  browserProfileName: ''
  // hideMyAccProfileDir: ''
}

export const FEATURE_OPTION_DEFAULT = {
  reUpPost: {
    enable: false,
    profiles: '',
    mixRandomProfiles: false,
    chatOpenAIPrefix: '',
    randomTotalPostsReUp: '1,1',
    reUpWithImage: false,
    reUpWithVideo: false
  },
  interactAds: {
    enable: false,
    profiles: '',
    mixRandomProfiles: false,
    replayAction: 'timeout',
    replayActionTimeout: 5,
    allowLikeAction: [false],
    allowCommentAction: [false],
    chatOpenAIPrefix: '',
    randomDelayTimeProfiles: '',
    randomDelayTimeActions: ''
  },
  followProfiles: {
    enable: false,
    profiles: '',
    mixRandomProfiles: false
  },
  fairInteract: {
    enable: false,
    fairInteractOptions: null,
    entryDetailUrls: '',
    mixRandomEntryDetailUrls: false,
    totalPosts: 0,
    chatOpenAIPrefix: ''
  },
  buffViews: {
    enable: false,
    entryDetailUrls: '',
    mixRandomEntryDetailUrls: false,
    totalViews: 0
  },
  newsFeed: {
    enable: false,
    replayAction: 'off',
    replayActionTimeout: 5,
    stopAction: STOP_ACTION_OPTION.timeout,
    stopActionTimeout: 5,
    stopActionRandomTotalPosts: '5,10',
    randomDelayTimeActions: '5,10',
    allowLikeAction: [false],
    allowCommentAction: [false],
    chatOpenAIPrefix: ''
  },
  interactSpecialization: {
    enable: false,
    entryDetailUrls: '',
    mixRandomEntryDetailUrls: false,
    randomDelayTimeActions: '5,10',
    allowLikeAction: [false],
    allowCommentAction: [false],
    chatOpenAIPrefix: ''
  }
}
