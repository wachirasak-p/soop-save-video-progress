let autoSaveInterval = null;
let hasJumped = false;

// 🔁 เปลี่ยน url แล้ว trigger init ใหม่
let lastUrl = location.href;

// ---------------- UTILS ----------------
function timeToSeconds(timeStr) {
  const parts = timeStr.split(":").map(Number);
  return parts.reduce((acc, val) => acc * 60 + val, 0);
}

function showJumpNotification(timeStr) {
  const toast = document.createElement("div");
  toast.textContent = `⏩ กลับไปที่เวลา ${timeStr}`;
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    padding: "10px 16px",
    background: "rgba(0, 0, 0, 0.85)",
    color: "#fff",
    fontSize: "14px",
    borderRadius: "8px",
    zIndex: "99999",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
    transition: "opacity 0.3s ease",
    opacity: "1",
  });
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ---------------- LOGIC ----------------

function tryJumpToSavedTime() {
  if (hasJumped) {
    console.log("⚠️ already jumped — skipping");
    return;
  }

  const encodedUrl = encodeURIComponent(location.href);
  const key = `autosave:${encodedUrl}`;

  chrome.storage.local.get([key], (result) => {
    const savedTime = result[key];
    if (!savedTime) {
      console.warn("📭 ไม่มีค่า autosave ใน storage สำหรับ URL นี้");
      return;
    }

    const seconds = timeToSeconds(savedTime);
    const video = document.querySelector("video");

    if (!video) {
      console.warn("❌ ไม่เจอ <video> element");
      return;
    }

    if (video.readyState < 1) {
      console.warn("⏳ video ยังไม่พร้อม (readyState < 1)");
      return;
    }

    video.currentTime = seconds;
    hasJumped = true;
    showJumpNotification(savedTime);
    console.log(`⏩ Jumped to ${savedTime} (${seconds} วินาที)`);
  });
}

function startAutoSave() {
  stopAutoSave();
  autoSaveInterval = setInterval(() => {
    const span = document.querySelector("span.sc-fb6d4f81-0.huRsss");
    if (!span) return;
    const currentTime = span.textContent?.split(" / ")[0];
    if (!currentTime) return;

    const key = `autosave:${encodeURIComponent(location.href)}`;
    chrome.storage.local.set({ [key]: currentTime }, () => {
      console.log(`💾 auto-saved time ${currentTime}`);
    });
  }, 10000);
  console.log("⏳ Started auto-save");
}

function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
    console.log("🛑 Stopped auto-save");
  }
}

// ---------------- INIT ----------------

function initIfElementsExist() {
  const video = document.querySelector("video");
  const span = document.querySelector("span.sc-fb6d4f81-0.huRsss");

  if (video && span) {
    console.log("🚀 Found required elements — starting logic");

    // ลอง jump หลายรอบ (รองรับ video ready ช้า)
    let attempt = 0;
    const jumpTimer = setInterval(() => {
      tryJumpToSavedTime();
      attempt++;
      if (hasJumped || attempt >= 10) clearInterval(jumpTimer);
    }, 1000);

    startAutoSave();
    return true;
  }
  return false;
}

function setupWatcher() {
  const observer = new MutationObserver(() => {
    if (initIfElementsExist()) {
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function checkUrlChangeLoop() {
  setInterval(() => {
    if (location.href !== lastUrl) {
      console.log("🔁 URL changed → re-initialize");
      lastUrl = location.href;
      hasJumped = false;
      stopAutoSave();
      setupWatcher();
    }
  }, 500);
}

// ---------------- STARTUP ----------------

setupWatcher(); // ตรวจ DOM เมื่อโหลด
checkUrlChangeLoop(); // ตรวจ route change ทุกครึ่งวิ
