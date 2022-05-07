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
    const tabId = tabs[0].id;
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
    if (originalUrl.startsWith(
            'https://iss.ndl.go.jp/api/sru?operation=searchRetrieve&query=isbn=')) {
      chrome.scripting.executeScript(
          {
            func: () => {
              return document.body.childNodes[0].innerHTML;
            },
            target: {
              tabId: tabId,
            }
          },
          (injectionResults) => {
            for (const frameResult of injectionResults) {
              const xml = frameResult.result;
              const data = (new DOMParser()).parseFromString(xml, 'text/xml');
              const records = [
                ...data.querySelectorAll(
                    'searchRetrieveResponse records record recordData')
              ].map((e) => e.innerHTML);

              urlDiv.innerText = '';
              for (const record of records) {
                const e = Object.fromEntries(
                    record.split('&lt;')
                        .map(e => e.trim())
                        .filter(e => e.length && !e.startsWith('/'))
                        .map(e => e.split('&gt;')));
                const text = `${e['dc:title']}\t${e['dc:creator']}\t${
                    e['dc:publisher']}`;
                const div = document.createElement('div');
                div.innerText = text;
                urlDiv.appendChild(div);
                div.addEventListener('click', () => {
                  copyToClipboard(text, 'text/plain;charset=UTF-8');
                  div.style = "background-color: red;";
                  setTimeout(() => {
                    div.style = "background-color: none;";
                    chrome.tabs.remove(tabId);
                  }, 1000);
                });
              }
            }
          });
    }
  });
});
