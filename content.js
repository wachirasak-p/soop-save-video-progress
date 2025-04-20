function timeToSeconds(timeStr) {
  const parts = timeStr.split(":").map(Number);
  return parts.reduce((acc, val) => acc * 60 + val, 0);
}

function seekToLastWatchedTime() {
  const encodedUrl = encodeURIComponent(window.location.href);
  const key = `autosave:${encodedUrl}`;

  chrome.storage.local.get([key], (result) => {
    const savedTime = result[key];
    if (!savedTime) {
      console.log("📭 No saved time found");
      return;
    }

    const seconds = timeToSeconds(savedTime);
    console.log(`💡 Found autosave: ${savedTime} (${seconds}s)`);

    const video = document.querySelector("video");
    if (video) {
      video.currentTime = seconds;
      showJumpNotification(savedTime);

      console.log(`⏩ Jumped to ${savedTime}`);
    } else {
      console.warn("❌ Video element not found when trying to seek.");
    }
  });
}

function autoSaveTime() {
  const span = document.querySelector("span.sc-fb6d4f81-0.huRsss");
  if (!span) return;

  const currentTime = span.textContent?.split(" / ")[0];
  if (!currentTime) return;

  const encodedUrl = encodeURIComponent(window.location.href);
  const key = `autosave:${encodedUrl}`;

  chrome.storage.local.set({ [key]: currentTime }, () => {
    console.log(`✅ Auto-saved time ${currentTime}`);
  });
}

setInterval(autoSaveTime, 10000);

// ✅ เช็คซ้ำซ้อน ทั้ง Observer + Fallback Timer
let hasJumped = false;

function trySeekIfVideoReady() {
  if (hasJumped) return;
  const video = document.querySelector("video");
  if (video) {
    hasJumped = true;
    seekToLastWatchedTime();
  }
}

// 1. MutationObserver
const observer = new MutationObserver(() => {
  trySeekIfVideoReady();
});
observer.observe(document.body, { childList: true, subtree: true });

// 2. fallback interval
const fallback = setInterval(() => {
  trySeekIfVideoReady();
}, 500);

// 3. auto clear after 10s
setTimeout(() => {
  clearInterval(fallback);
  observer.disconnect();
}, 10000);

function showJumpNotification(timeStr) {
  const toast = document.createElement("div");
  toast.textContent = `⏩ กลับไปที่เวลา ${timeStr}`;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.padding = "10px 16px";
  toast.style.background = "rgba(0, 0, 0, 0.8)";
  toast.style.color = "#fff";
  toast.style.fontSize = "14px";
  toast.style.borderRadius = "8px";
  toast.style.zIndex = "9999";
  toast.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)";
  toast.style.transition = "opacity 0.3s ease";
  toast.style.opacity = "1";

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2500);
}
