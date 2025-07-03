// popup.js

if (typeof browser === 'undefined') {
    var browser = chrome;
}

// ====== DOM elements ======
const openEquipBtn = document.getElementById("openEquip");
const openFlamesBtn = document.getElementById("openFlames");
const openSymbolsBtn = document.getElementById("openSymbols");

const resetAllBtn = document.getElementById("resetAll");
const resetConfirmEl = document.getElementById("resetConfirm");
const resetYesBtn = document.getElementById("resetYes");
const resetNoBtn = document.getElementById("resetNo");

const clearBtn = document.getElementById("clearBtn");
const clearConfirmEl = document.getElementById("clearConfirm");
const clearYesBtn = document.getElementById("clearYes");
const clearNoBtn = document.getElementById("clearNo");

const statusMessageEl = document.getElementById("statusMessage");

// ====== Utility for status messages ======
function showStatus(message) {
    if (!statusMessageEl) return;
    statusMessageEl.textContent = message;
    setTimeout(() => {
        statusMessageEl.textContent = "";
    }, 4000);
}

// Quick link buttons
openEquipBtn.addEventListener("click", () => {
    browser.tabs.create({ url: "https://www.whackybeanz.com/calc/equips/setup" });
});

openFlamesBtn.addEventListener("click", () => {
    browser.tabs.create({ url: "https://www.whackybeanz.com/calc/equips/flames" });
});

openSymbolsBtn.addEventListener("click", () => {
    browser.tabs.create({ url: "https://www.whackybeanz.com/calc/symbols" });
});

// ====== RESET ALL STORED DATA (inline confirmation) ======
resetAllBtn.addEventListener("click", () => {
    resetAllBtn.style.display = "none";
    resetConfirmEl.style.display = "block";
});

resetYesBtn.addEventListener("click", async () => {
    try {
        await browser.storage.local.clear();
        showStatus("All saved data cleared.");
    } catch (err) {
        alert("Error resetting all data: " + err);
    } finally {
        resetConfirmEl.style.display = "none";
        resetAllBtn.style.display = "inline-block";
    }
});

resetNoBtn.addEventListener("click", () => {
    showStatus("Reset cancelled.");
    resetConfirmEl.style.display = "none";
    resetAllBtn.style.display = "inline-block";
});

// ====== CLEAR PAGE LOCALSTORAGE by "Loading" an Empty Object ======
clearBtn.addEventListener("click", () => {
    clearBtn.style.display = "none";
    clearConfirmEl.style.display = "block";
});

clearYesBtn.addEventListener("click", async () => {
    try {
        // 1) "Load" an empty object => effectively clears localStorage
        const response = await setLocalStorageOnPage({});
        if (response?.status === "ok") {
            showStatus("Page localStorage cleared. Reloading in a moment...");

            // 2) Short delay to avoid "message port closed" error
            setTimeout(async () => {
                const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
                if (tab?.id) {
                    await browser.tabs.reload(tab.id);
                }
            }, 500);

        } else {
            alert("Failed to clear localStorage. Possibly no response from content script.");
        }
    } catch (err) {
        alert("Error clearing localStorage: " + err);
    } finally {
        clearConfirmEl.style.display = "none";
        clearBtn.style.display = "inline-block";
    }
});

clearNoBtn.addEventListener("click", () => {
    showStatus("Clear localstorage cancelled.");
    clearConfirmEl.style.display = "none";
    clearBtn.style.display = "inline-block";
});

// ====== CONTENT SCRIPT HELPERS ======
async function getLocalStorageFromPage() {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return null;

    return new Promise((resolve) => {
        browser.tabs.sendMessage(tab.id, { action: "getLocalStorage" }, (response) => {
            if (browser.runtime.lastError) {
                alert("getLocalStorage error: " + browser.runtime.lastError.message);
                return resolve(null);
            }
            resolve(response?.localStorageData || null);
        });
    });
}

async function setLocalStorageOnPage(data) {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return null;

    return new Promise((resolve) => {
        browser.tabs.sendMessage(tab.id, { action: "setLocalStorage", data }, (response) => {
            if (browser.runtime.lastError) {
                alert("setLocalStorage error: " + browser.runtime.lastError.message);
                return resolve(null);
            }
            resolve(response);
        });
    });
}
