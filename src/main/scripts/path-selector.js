export const commonPathSelector = {
  divBtn: 'div[role="button"]',
  appBarBack: 'div[role="button"][data-testid="app-bar-back"]',
  primaryColumn: 'div[data-testid="primaryColumn"]',
  headerBarOfPrimaryColumn:
    'div[data-testid="primaryColumn"] > div[tabindex="0"] > div:first-child',
  headingOfPrimaryColum:
    'div[data-testid="primaryColumn"] > div[tabindex="0"] > div:first-child',
  profileLink:
    'header[role="banner"] nav[role="navigation"] a[role="link"][data-testid="AppTabBar_Profile_Link"]',
  timelineSection: 'section[aria-labelledby^="accessible-list-"]',
  entryUrl: (username, entryId) =>
    `a[href="/${username}/status/${entryId}"][role="link"][dir="ltr"]`,
  entryAvatarUserNameUrl: (username) =>
    `div[data-testid="UserAvatar-Container-${username}"] a[href="/${username}"][role="link"]`,
  entryUserNameUrl: (username) =>
    `div[data-testid="User-Name"] a[href="/${username}"][role="link"]`,
  entryGroupAction: 'div[role="group"]',
  entryMedia: '[aria-labelledby^="id__"][aria-labelledby^="id__"][id^="id_"]',
  entryDescribed: (username, entryId) =>
    `a[href="/${username}/status/${entryId}"][role="link"][aria-describedby^="id__"][aria-label]`,
};

export const loginPathSelector = {
  btn: 'div[role="button"]',
  usernameInput: 'input[autocomplete="username"]',
  // nextBtn: 'div[role="button"]:nth-child(6)',
  passwordInput: 'input[name="password"]',
  // loginBtn:
  //   'div[role="button"][style="background-color: rgb(15, 20, 25); border-color: rgba(0, 0, 0, 0);"]',
  layerBottomBarUseCookieBtn:
    'div[id="react-root"] div[id="layers"] div[data-testid="BottomBar"] > div > div:nth-child(2) div[role="button"]',
};

export const profilePathSelector = {
  followBtn: (profileId) =>
    `div[role="button"][data-testid="${profileId}-follow"]`,
  unFollowBtn: (profileId) =>
    `div[role="button"][aria-label="Unfollow @${profileId}"]`,
  dialog: 'div[aria-labelledby="modal-header"][role="dialog"]',
  likeBtn: 'div[role="button"][data-testid="like"]',
  unlikeBtn: 'div[role="button"][data-testid="unlike"]',
  commentBtn: 'div[role="button"][data-testid="reply"]',
  closeDialogBtn: 'div[role="button"][data-testid="app-bar-close"]',
  input:
    'div[dir="ltr"] div[class="DraftEditor-root"] div[class="DraftEditor-editorContainer"]',
  submitBtn: 'div[role="button"][data-testid="tweetButton"]',
  timelineSection: 'section[aria-labelledby="accessible-list-0"]',
  postDetailUrl: (username, postId) =>
    `a[href="/${username}/status/${postId}"][role="link"][dir="ltr"]`,
  firstEntry: 'div[data-testid="cellInnerDiv"]:first-child',
  verifiedFollowerLink: (username) =>
    `a[role="link"][href="/${username}/verified_followers"]`,
};

export const composeTweetPathSelector = {
  dialog: 'div[aria-labelledby="modal-header"][role="dialog"]',
  input:
    'div[aria-labelledby="modal-header"][role="dialog"] div[dir="ltr"] div[class="DraftEditor-root"] div[class="DraftEditor-editorContainer"]',
  submitBtn:
    'div[aria-labelledby="modal-header"][role="dialog"] div[role="button"][data-testid="tweetButton"]',
  confirmationSheetDialog: `div[data-testid="confirmationSheetDialog"]`,
  confirmationSheetDialogSaveBtn:
    'div[data-testid="confirmationSheetConfirm"][role="button"]',
  confirmationSheetDialogDiscardBtn:
    'div[data-testid="confirmationSheetCancel"][role="button"]',
};

export const homePathSelector = {
  profileLink: 'a[role="link"][data-testid="AppTabBar_Profile_Link"]',
};

// const detailedTweetPathSelector = {
//   progressBarComment
// };

export const followerPathSelector = {
  userCellBtn:
    'div[data-testid="cellInnerDiv"] div[role="button"][data-testid="UserCell"]',
  avatar: (username) => `div[data-testid="UserAvatar-Container-${username}"]`,
  followBtn: (profileId) =>
    `div[role="button"][data-testid="${profileId}-follow"]`,
};

export const tweetDetailPathSelector = {
  progressBar:
    'div[data-testid="cellInnerDiv"] > div > div > div[role="progressbar"]',
  showMoreRepliesButton: `div[data-testid="cellInnerDiv"] > div > div > div[role="button"]`,
  showAdditionalRepliesButton: `div[data-testid="cellInnerDiv"] article[role="article"][tabindex="-1"] > div > div > div:nth-child(2) > div > div > div:nth-child(2) > div[role="button"]`,
  article: 'article[data-testid="tweet"][tabindex="0"]',
  linkAds: (expandedUrl) =>
    `a[target="_blank"][role="link"][href^="${expandedUrl}"]`,
  cardLayoutDetailLinkAds: (expandedUrl) =>
    `a[target="_blank"][role="link"][href^="${expandedUrl}"] div[data-testid="card.layoutLarge.detail"]`,
  linkAdsBlank: 'div[data-testid="card.wrapper"] a[target="_blank"]',
  videoLayout: 'div[data-testid="card.layoutLarge.media"]',
  videoPlayPathIcon: 'path[d="M21 12L4 2v20l17-10z"]',
  videoStopPathIcon: 'path[d="M4 2h5v20H4V2zm11 20h5V2h-5v20z"]',
  videoRePlayIcon:
    'path[d="M12 4c-4.418 0-8 3.58-8 8s3.582 8 8 8c3.806 0 6.993-2.66 7.802-6.22l1.95.44C20.742 18.67 16.76 22 12 22 6.477 22 2 17.52 2 12S6.477 2 12 2c3.272 0 6.176 1.57 8 4V3.5h2v6h-6v-2h2.616C17.175 5.39 14.749 4 12 4z"]',
  photo: 'div[data-testid="tweetPhoto"]',
};

export const dialogPathSelector = {
  dialog: 'div[aria-labelledby="modal-header"][role="dialog"]',
  closeBtn: 'div[role="presentation"] div[role="button"]',
};
