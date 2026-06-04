chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "create-button",
    title: "この要素の中にボタンを追加する",
    contexts: ["all"] 
  });
  chrome.contextMenus.create({
    id: "buttons",
    title: "このサイトのボタンを管理する",
    contexts: ["all"] 
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "create-button" && tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: "open-buttonmaker" });
  } else if (info.menuItemId === "buttons" && tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: "open-buttonlist" });
  }
});