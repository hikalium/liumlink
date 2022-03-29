chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  const h = new Date().getHours();
  if (6 < h) {
    return;
  }
  const denyList = [
    'https://tweetdeck.twitter.com',
    'https://twitter.com',
    'youtube.com',
  ];
  if (changeInfo.status == 'complete') {
    chrome.tabs.get(tabId, (tab) => {
      console.log(`URL: ${tab.url}`);
      for (url of denyList) {
        if (tab.url.indexOf(url) != -1) {
          chrome.scripting.executeScript({
            func: () => {
              document.body.innerHTML = '<h1 style="background-color: white; color: black;">Time is up! Go to bed now!</h1>';
            },
            target: {
              tabId: tabId,
            }
          });
        }
      }
    })
  }
});
