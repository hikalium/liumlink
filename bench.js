function sleep(time) {
  return new Promise((resolve) => {setTimeout(resolve, time)})
}

document.addEventListener('DOMContentLoaded', function() {
  const chart = bb.generate({bindto: '#chart', data: {type: 'bar', json: {}}});
  const benchButton = document.getElementById('benchButton');
  const benchResultDiv = document.getElementById('benchResultDiv');
  const benchResultList = [];
  const runOpenTabsBench = async function(numTabs) {
    const tabIdList = [];
    const t0 = performance.now();
    for (let i = 0; i < numTabs; i++) {
      const t = await chrome.tabs.create({url: 'nothing.html', active: false});
      tabIdList.push(t.id);
    }
    for (const tabId of tabIdList) {
      while (true) {
        const t = await chrome.tabs.get(tabId);
        if (t.status === 'complete') {
          break;
        }
      }
    };
    const t1 = performance.now();
    const diff = t1 - t0;
    benchResultList.push(diff);
    const data = {};
    data[`Open ${numTabs} tabs once`] = benchResultList;
    chart.load({json: data});
  };
  const runBench1x1000 = async function() {
    for (let i = 0; i < 1000; i++) {
      await runOpenTabsBench(1);
    }
  };
  benchButton.addEventListener('click', runBench1x1000);
});

