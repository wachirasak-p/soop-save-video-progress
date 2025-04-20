function getUrl(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    callback(tabs[0].url);
  });
}

function getSpanTime(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: () => {
          const span = document.querySelector("span.sc-fb6d4f81-0.huRsss");
          return span?.textContent?.split(" / ")[0] || null;
        },
      },
      (results) => {
        if (results && results[0].result) {
          callback(results[0].result);
        } else {
          callback(null);
        }
      }
    );
  });
}

function timeToSeconds(timeStr) {
  const parts = timeStr.split(":").map(Number);
  return parts.reduce((acc, val) => acc * 60 + val, 0);
}

function loadAutoTime(url) {
  const encodedUrl = encodeURIComponent(url);
  const key = `autosave:${encodedUrl}`;
  chrome.storage.local.get([key], (res) => {
    document.getElementById("auto").textContent = `Auto saved: ${
      res[key] || "None"
    }`;
  });
}

function loadManualSaves(url) {
  const encodedUrl = encodeURIComponent(url);
  const key = `manualsaves:${encodedUrl}`;
  chrome.storage.local.get([key], (res) => {
    const list = res[key] || [];
    const ul = document.getElementById("savedList");
    ul.innerHTML = "";
    list.forEach((t) => {
      const li = document.createElement("li");
      li.textContent = t;
      li.addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const seconds = timeToSeconds(t);
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (seekSeconds) => {
              const video = document.querySelector("video");
              if (video) {
                video.currentTime = seekSeconds;
              }
            },
            args: [seconds],
          });
        });
      });
      ul.appendChild(li);
    });
  });
}

document.getElementById("saveBtn").addEventListener("click", () => {
  getUrl((url) => {
    const encodedUrl = encodeURIComponent(url);
    getSpanTime((time) => {
      if (!time) {
        alert("ไม่พบเวลาในวิดีโอ");
        return;
      }

      const key = `manualsaves:${encodedUrl}`;
      chrome.storage.local.get([key], (res) => {
        const list = res[key] || [];
        list.unshift(time);
        if (list.length > 5) list.pop(); // keep max 5
        chrome.storage.local.set({ [key]: list }, () => {
          loadManualSaves(url);
        });
      });
    });
  });
});

getUrl((url) => {
  loadAutoTime(url);
  loadManualSaves(url);
});
