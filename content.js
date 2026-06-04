let lastRightClickedElement = null;

document.addEventListener("contextmenu", (event) => {
  lastRightClickedElement = event.target;
}, true);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "open-buttonmaker" && lastRightClickedElement) {
    const selector = getUniqueQuerySelector(lastRightClickedElement);
    if (selector) {
      showEditorPanel(selector);
    }
  } else if (message.type === "open-buttonlist") {
    showButtonsPanel();
  }
});

function showEditorPanel(targetSelector) {
  if (document.getElementById("btn-editor-panel")) return;

  const panel = document.createElement("div");
  panel.id = "btn-editor-panel";
  
  Object.assign(panel.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    backgroundColor: "#2c3e50",
    color: "#ffffff",
    padding: "15px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
    zIndex: "999999",
    fontFamily: "sans-serif",
    boxSizing: "border-box",
    display: "inline-block",
    flexWrap: "wrap",
    gap: "10px",
    alignItems: "center"
  });

  panel.innerHTML = `
    <div style="font-weight:bold; font-size:14px; margin-right:10px;">ボタンカスタム編集</div>
    <input type="text" id="edit-label" placeholder="ラベル (例: マイボタン)" style="${inputStyle()}"><br>
    <input type="text" id="edit-id" placeholder="id (任意)" style="${inputStyle()}"><br>
    <input type="text" id="edit-class" placeholder="class (任意)" style="${inputStyle()}"><br>
    <input type="text" id="edit-css" placeholder="style (例: color:red;)" style="${inputStyle()} width:250px;"><br>
    <input type="text" id="edit-href" placeholder="ジャンプ先URL (任意)" style="${inputStyle()} width:250px;"><br>
    <button id="btn-save-submit" style="${btnStyle('#2ecc71')}">作成＆保存</button>
    <button id="btn-save-cancel" style="${btnStyle('#e74c3c')}">キャンセル</button>
  `;

  document.body.appendChild(panel);

  document.getElementById("btn-save-cancel").addEventListener("click", () => {
    panel.remove();
  });

  document.getElementById("btn-save-submit").addEventListener("click", () => {
    const config = {
      id: Date.now().toString(),
      selector: targetSelector,
      label: document.getElementById("edit-label").value || "ボタン",
      elemId: document.getElementById("edit-id").value,
      elemClass: document.getElementById("edit-class").value,
      style: document.getElementById("edit-css").value,
      href: document.getElementById("edit-href").value,
    };

    const targetElement = document.querySelector(targetSelector);
    if (targetElement) {
      createCustomButton(targetElement, config);
    }

    saveButtonConfig(config);
    panel.remove();
  });
}

function showButtonsPanel() {
  if (document.getElementById("btn-manager-panel")) return;

  const panel = document.createElement("div");
  panel.id = "btn-manager-panel";
  
  Object.assign(panel.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    maxHeight: "40vh",
    overflowY: "auto",
    backgroundColor: "#34495e",
    color: "#ffffff",
    padding: "15px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
    zIndex: "999999",
    fontFamily: "sans-serif",
    boxSizing: "border-box"
  });

  const header = document.createElement("div");
  Object.assign(header.style, {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    borderBottom: "1px solid #4e6a85",
    paddingBottom: "5px"
  });
  header.innerHTML = `
    <span style="font-weight:bold; font-size:14px;">現在のサイトのカスタムボタン一覧</span>
    <button id="btn-mgr-close" style="${btnStyle('#e74c3c')}">閉じる</button>
  `;
  panel.appendChild(header);

  const listContainer = document.createElement("div");
  listContainer.id = "btn-mgr-list";
  panel.appendChild(listContainer);

  document.body.appendChild(panel);

  document.getElementById("btn-mgr-close").addEventListener("click", () => {
    panel.remove();
  });

  chrome.storage.local.get({ savedButtons: {} }, (data) => {
    const buttons = data.savedButtons[location.href] || [];
    
    if (buttons.length === 0) {
      listContainer.innerHTML = `<p style="font-size:12px; color:#bdc3c7;">登録されているボタンはありません。</p>`;
      return;
    }

    buttons.forEach((config) => {
      const item = document.createElement("div");
      Object.assign(item.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#2c3e50",
        padding: "8px",
        borderRadius: "4px",
        marginBottom: "5px",
        fontSize: "12px"
      });

      item.innerHTML = `
        <div>
          <strong>${config.label}</strong> 
          <span style="color:#bdc3c7; margin-left:10px;">Selector: ${config.selector}</span>
        </div>
        <button class="btn-mgr-delete" data-id="${config.id}" style="${btnStyle('#e74c3c')} padding:3px 8px;">削除</button>
      `;

      item.querySelector(".btn-mgr-delete").addEventListener("click", (e) => {
        const idToDelete = e.target.getAttribute("data-id");
        deleteButtonConfig(idToDelete);
        item.remove(); 
      });

      listContainer.appendChild(item);
    });
  });
}

function createCustomButton(parentElement, config) {
  const btn = document.createElement("button");
  
  btn.setAttribute("data-custom-btn-id", config.id);
  btn.classList.add("my-custom-button-generated");
  
  if (config.elemClass) {
    config.elemClass.split(" ").forEach(cls => {
      if (cls.trim()) btn.classList.add(cls.trim());
    });
  }

  if (config.elemId) {
    btn.id = config.elemId;
  }

  btn.innerText = config.label;
  btn.style.margin = "5px";
  btn.style.padding = "5px 10px";
  btn.style.cursor = "pointer";
  
  if (config.style) {
    btn.style.cssText += ";" + config.style; 
  }

  if (config.href && config.href.trim() !== "") {
    btn.addEventListener("click", () => {
        location.href = config.href;
    });
  }

  parentElement.appendChild(btn);
}

function saveButtonConfig(newConfig) {
  chrome.storage.local.get({ savedButtons: {} }, (data) => {
    const copyd_buttons = data.savedButtons; 
    
    if (!copyd_buttons[location.href]) {
      copyd_buttons[location.href] = [];
    }
    
    copyd_buttons[location.href].push(newConfig);
    chrome.storage.local.set({ savedButtons: copyd_buttons });
  });
}

function deleteButtonConfig(id) {
  chrome.storage.local.get({ savedButtons: {} }, (data) => {
    const allButtons = data.savedButtons;
    if (!allButtons[location.href]) return;

    allButtons[location.href] = allButtons[location.href].filter(btn => btn.id !== id);

    chrome.storage.local.set({ savedButtons: allButtons }, () => {
      const liveButton = document.querySelector(`[data-custom-btn-id="${id}"]`);
      if (liveButton) {
        liveButton.remove();
      }
    });
  });
}

function restoreAllButtons() {
  chrome.storage.local.get({ savedButtons: {} }, (data) => {
    if (!data.savedButtons || !data.savedButtons[location.href]) return;
    
    data.savedButtons[location.href].forEach((config) => {
      try {
        const element = document.querySelector(config.selector);
        if (element) {
          createCustomButton(element, config);
        }
      } catch (e) {
        console.error("ボタンの復元に失敗しました:", config, e);
      }
    });
  });
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", restoreAllButtons);
} else {
  restoreAllButtons();
}

function inputStyle() {
  return "padding:6px 10px; border:none; border-radius:4px; font-size:12px; min-width:100px; color:#ffffff;";
}
function btnStyle(bgColor) {
  return `padding:6px 12px; border:none; border-radius:4px; font-size:12px; background-color:${bgColor}; color:#fff; cursor:pointer; font-weight:bold;`;
}

function getUniqueQuerySelector(el) {
  if (!(el instanceof Element)) return null;
  const path = [];
  while (el.nodeType === Node.ELEMENT_NODE) {
    let selector = el.nodeName.toLowerCase();
    if (el.id) {
      selector += '#' + el.id;
      path.unshift(selector);
      break; 
    } else {
      let sib = el, nth = 1;
      while (sib = sib.previousElementSibling) {
        if (sib.nodeName.toLowerCase() == selector) nth++;
      }
      if (nth != 1) selector += ":nth-of-type(" + nth + ")";
    }
    path.unshift(selector);
    el = el.parentNode;
  }
  return path.join(" > ");
}