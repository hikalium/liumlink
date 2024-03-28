
document.addEventListener('DOMContentLoaded', function() {
  const benchButton = document.getElementById('benchButton');
  const benchResultDiv = document.getElementById('benchResultDiv');
  const runBench = async function() {
    const tabs = [];
    const t0 = performance.now();
    for (let i = 0; i < 10; i++) {
      const t = chrome.tabs.create({url: 'nothing.html', active: false}).await;
      tabs.push(t);
    }
    const t1 = performance.now();
    const diff = t1 - t0;
    benchResultDiv.innerHTML += `<p>${diff}</p>`
  };
  document.addEventListener('click', runBench);
});
