function sleep(time) {
  return new Promise((resolve) => {setTimeout(resolve, time)})
}

document.addEventListener('DOMContentLoaded', function() {
  const benchButton = document.getElementById('benchButton');
  const benchResultDiv = document.getElementById('benchResultDiv');
  const runBench = async function() {
    const tabIdList = [];
    const t0 = performance.now();
    for (let i = 0; i < 10; i++) {
      const t = await chrome.tabs.create({url: 'nothing.html', active: false});
      tabIdList.push(t.id);
    }
    for (const tabId of tabIdList) {
      while (true) {
        const t = await chrome.tabs.get(tabId);
        if (t.status === 'complete') {
          break;
        }
        await sleep(1);
      }
    };
    const t1 = performance.now();
    const diff = t1 - t0;
    benchResultDiv.innerHTML += `<p>${diff}</p>`
  };
  benchButton.addEventListener('click', runBench);
});
