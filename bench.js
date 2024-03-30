function sleep(time) {
  return new Promise((resolve) => {setTimeout(resolve, time)})
}

function getInnerTextOfTab(tabId) {
  return new Promise((resolve) => {
    chrome.scripting.executeScript(
        {
          func: () => {
            return document.body.innerText;
          },
          target: {
            tabId: tabId,
          }
        },
        (injectionResults) => {
          for (const frameResult of injectionResults) {
            const result = frameResult.result;
            resolve(result);
          }
        });
  });
}

async function getInnerTextOfUrl(url) {
  const tab = await chrome.tabs.create({url: url, active: false});
  const text = await getInnerTextOfTab(tab.id);
  await chrome.tabs.remove(tab.id);
  return text;
}

function extractBiosInfoAttr(biosInfoLines, key) {
  return biosInfoLines.filter((s) => s.startsWith(key))[0]
      .split(' = ')[1]
      .split('#')[0]
      .trim();
}

async function takeLog(benchResultDiv) {
  const biosInfo = await getInnerTextOfUrl('file:///var/log/bios_info.txt');
  // console.log(biosInfo);
  const biosInfoLines = biosInfo.split('\n');
  const hwid = extractBiosInfoAttr(biosInfoLines, 'hwid');
  benchResultDiv.innerText += `hwid: ${hwid}\n`;
  const fwid = extractBiosInfoAttr(biosInfoLines, 'fwid');
  benchResultDiv.innerText += `fwid: ${fwid}\n`;
}


document.addEventListener('DOMContentLoaded', function() {
  const chart = bb.generate({
    bindto: '#chart',
    legend: {show: false},
    data: {
      type: 'scatter',
      json: {},
    },
    axis: {
      x: {label: 'Effective tabs opened'},
      y: {label: 'Time took (ms)'},
    }
  });
  const histChart = bb.generate({
    bindto: '#histChart',
    legend: {show: false},
    title: {text: 'Time distribution'},
    data: {
      type: 'step',
      json: {},
    },
    axis: {
      x: {label: 'Time range (ms, left inclusive)'},
      y: {label: 'Frequency'},
    },
    line: {step: {type: 'step-after', tooltipMatch: true}},
  });
  const totalHistChart = bb.generate({
    bindto: '#totalHistChart',
    legend: {show: false},
    title: {text: 'Time distribution (All data)'},
    data: {
      type: 'step',
      json: {},
    },
    axis: {
      x: {label: 'Time range (ms, left inclusive)'},
      y: {label: 'Frequency'},
    },
    line: {step: {type: 'step-after', tooltipMatch: true}},
  });
  const takeLogButton = document.getElementById('takeLogButton');
  const benchButton = document.getElementById('benchButton');
  const benchResultDiv = document.getElementById('benchResultDiv');
  const tabsPerIterInput = document.getElementById('tabsPerIterInput');
  const iterCountInput = document.getElementById('iterCountInput');
  const repeatCountInput = document.getElementById('repeatCountInput');
  const histogramStepWidth = 10;
  const histogramNumSteps = 30;
  const totalHistogram = [];
  const totalHistogramXList = [];
  let runCount = 0;
  for (let i = 0; i < histogramNumSteps; i++) {
    totalHistogram[i] = 0;
    totalHistogramXList[i] = i * histogramStepWidth;
  }
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
    }
    const key = `#${runCount}: Open ${tabsPerIter} tabs once * ${iterCount}`;
    const xKey = 'x_' + key;
    {
      const data = {};
      data[key] = benchResultList;
      data[xKey] = benchResultXList;
      const xs = {};
      xs[key] = xKey;
      chart.load({json: data, xs: xs});
    }
    {
      const histogram = [];
      const histogramXList = [];
      for (let i = 0; i < histogramNumSteps; i++) {
        histogram[i] = 0;
        histogramXList[i] = i * histogramStepWidth;
      }
      for (const t of benchResultList) {
        const i = Math.floor(t / histogramStepWidth);
        if (i < histogramNumSteps) {
          histogram[i]++;
          totalHistogram[i]++;
        }
      }
      {
        const data = {};
        data[key] = histogram;
        data[xKey] = histogramXList;
        const xs = {};
        xs[key] = xKey;
        histChart.load({json: data, xs: xs});
      }
      {
        const data = {};
        data['total'] = totalHistogram;
        data['xtotal'] = totalHistogramXList;
        const xs = {};
        xs['total'] = 'xtotal';
        totalHistChart.load({json: data, xs: xs});
      }
    }
    for (const tabId of tabIdToBeRemovedList) {
      await chrome.tabs.remove(tabId);
    }
  };
  benchButton.addEventListener('click', async () => {
    const repeatCount = parseInt(repeatCountInput.value);
    for (let i = 0; i < repeatCount; i++) {
      await runBench();
    }
  });
  takeLogButton.addEventListener('click', async () => {
    await takeLog(benchResultDiv);
  });
});

