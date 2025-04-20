chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    /^https:\/\/(www\.)?sooplive\.com\/video\//.test(tab.url)
  ) {
    console.log("🔧 Injecting content.js into", tab.url);
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
  }
});
