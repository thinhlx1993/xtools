export const STORE_KEYS = {
  BROWSER_OPTION: 'browserOption',
  BROWSER_EXEC_PATH: 'browserExecPath',
  TRENDING_HASH_TAG: 'trendingHashTag',
  SECRET_KEY_RANDOM: 'secretKeyRandom',
  KEY_ACTIVATION: 'keyActivation',
  KEY_ACTIVATION_STATUS: 'keyActivationStatus',
  DEVIDE_ID: 'deviceID',
  ACCESS_TOKEN: 'accessToken'
}

export const BROWSER_TYPE = {
  chrome: 'chrome',
  hideMyAcc: 'hideMyAcc'
}

export const SCRIPT_STATUS = {
  init: 'init',
  initSuccess: 'initSuccess',
  initFail: 'initFail',
  login: 'login',
  loginSuccess: 'loginSuccess',
  loginFail: 'loginFail',
  getAccountInfo: 'getAccountInfo',
  getAccountInfoSuccess: 'getAccountInfoSuccess',
  getAccountInfoInfoError: 'getAccountInfoInfoError',
  start: 'start',
  startError: 'startError',
  playing: 'playing',
  stopping: 'stopping',
  stopped: 'stopped',
  forceStop: 'forceStop'
}

export const FEATURE_TYPE = {
  reUpPost: 'reUpPost',
  interactAds: 'interactAds',
  followProfiles: 'followProfiles',
  buffViews: 'buffViews',
  fairInteract: 'fairInteract',
  newsFeed: 'newsFeed',
  interactSpecialization: 'interactSpecialization'
}

export const FAIR_INTERACT_OPTION = {
  totalPost: 'totalPost',
  entryUrl: 'entryUrl'
}

export const REPLAY_ACTION_OPTION = {
  off: 'off',
  timeout: 'timeout'
}

export const STOP_ACTION_OPTION = {
  timeout: 'timeout',
  randomTotalPosts: 'randomTotalPosts'
}

export const MAXIMUM_RETRY_CHATGPT = 5

export const CHROME_URLS = ['chrome-error://chromewebdata/']

export const HIDE_MY_ACC_API_ROOT = 'https://api-tuan.hidemyacc.com'

export const BACKEND_BASE_URL = 'http://157.230.192.238/api/v1'

export const API_CAP_GURU = 'https://api.cap.guru/'

export const DEFAULT_WINDOWS_SIZE = {
  width: 500,
  height: 500
}

export const defaultPuppeteerOptions = {
  headless: false,
  defaultViewport: {
    width: 1280,
    height: 750
  },
  args: [
    '--disable-notifications',
    '--disable-setuid-sandbox',
    '--lang=en-US',
    '--flag-switches-begin',
    '--disable-encryption',
    '--flag-switches-end',
    '--no-sandbox',
    `--window-size=${DEFAULT_WINDOWS_SIZE.width},${DEFAULT_WINDOWS_SIZE.height}`
  ],
  ignoreDefaultArgs: ['--enable-automation']
}

export const TASK_NAME_CONFIG = {
  Login: 'Login',
  GetCookie: 'Lấy cookie',
  Captcha: 'Giải Captcha'
}
