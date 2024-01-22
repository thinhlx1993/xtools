export const tweetXPath = {
  postCell: (username, entryId) =>
    `//div[contains(@data-testid, "cellInnerDiv") and descendant::a[@href="/${username}/status/${entryId}"]]`,
  entryAds: (username, entryId) =>
    `//div[@data-testid="cellInnerDiv" and .//div[@data-testid="placementTracking"] and .//a[@href="/${username}/status/${entryId}/analytics"]]`,
};

export const followXPath = {
  followerCell: (username) =>
    `//div[contains(@data-testid, "cellInnerDiv") and descendant::div[@data-testid="UserCell"] and descendant::a[@href="/${username}"]]`,
};
