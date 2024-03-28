function sleep(time) {
  return new Promise((resolve) => {setTimeout(resolve, time)})
}

document.addEventListener('DOMContentLoaded', function() {
  const chart = bb.generate({
    bindto: '#chart',
    data: {
      type: 'scatter',
      json: {},
    },
    axis: {
      x: {label: 'Effective tabs opened'},
      y: {label: 'Time took (ms)'},
    }
  });
  const benchButton = document.getElementById('benchButton');
  const benchResultDiv = document.getElementById('benchResultDiv');
  const tabsPerIterInput = document.getElementById('tabsPerIterInput');
  const iterCountInput = document.getElementById('iterCountInput');
  let runCount = 0;
  const runBench = async function() {
    runCount += 1;
    const benchResultList = [];
    const benchResultXList = [];
    const tabsPerIter = parseInt(tabsPerIterInput.value);
    const iterCount = parseInt(iterCountInput.value);
    const tabIdToBeRemovedList = [];
    for (let i = 0; i < iterCount; i++) {
      const tabIdList = [];
      const t0 = performance.now();
      for (let i = 0; i < tabsPerIter; i++) {
        const t =
            await chrome.tabs.create({url: 'nothing.html', active: false});
        tabIdList.push(t.id);
      }
      for (const tabId of tabIdList) {
        while (true) {
          const t = await chrome.tabs.get(tabId);
          if (t.status === 'complete') {
            tabIdToBeRemovedList.push(tabId);
            break;
          }
        }
      };
      const t1 = performance.now();
      const diff = t1 - t0;
      benchResultList.push(diff);
      benchResultXList.push((i + 1) * tabsPerIter);
      const key = `#${runCount}: Open ${tabsPerIter} tabs once * ${iterCount}`;
      const xKey = 'x_' + key;
      const data = {};
      data[key] = benchResultList;
      data[xKey] = benchResultXList;
      const xs = {};
      xs[key] = xKey;
      chart.load({json: data, xs: xs});
    }
    for (const tabId of tabIdToBeRemovedList) {
      await chrome.tabs.remove(tabId);
    }
  };
  benchButton.addEventListener('click', runBench);
});

