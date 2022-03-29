function copyToClipboard(str, mimeType) {
  document.oncopy = function(event) {
    event.clipboardData.setData(mimeType, str);
    event.preventDefault();
  };
  document.execCommand('copy', false, null);
}


document.addEventListener('DOMContentLoaded', function() {
  const statusDiv = document.getElementById('statusDiv');
  const urlDiv = document.getElementById('urlDiv');
  chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
    if (tabs.length != 1) {
      return;
    }
    const originalUrl = tabs[0].url;
    if (originalUrl.startsWith('https://www.amazon.co.jp/')) {
      const dps = originalUrl.match('dp/[A-Za-z0-9]+/');
      if (!dps || dps.length != 1) {
        return;
      }
      const url = 'https://www.amazon.co.jp/' + dps[0];
      copyToClipboard(url, 'text/plain;charset=UTF-8');
      statusDiv.innerText = 'Copied!';
      urlDiv.innerText = url;
    }
  });
});
