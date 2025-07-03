if (typeof browser === 'undefined') {
    var browser = chrome;
}

function showStatus(msg) {
    const el = document.getElementById('statusMessage');
    if (!el) return;
    el.textContent = msg;
    setTimeout(() => el.textContent = '', 5000);
}

const importBtn = document.getElementById('importBtn');
const importFileInput = document.getElementById('importFile');

importBtn.addEventListener('click', () => {
    if (!importFileInput.files || importFileInput.files.length === 0) {
        showStatus("No file selected.");
        return;
    }

    const file = importFileInput.files[0];
    file.text().then((fileText) => {
        const data = JSON.parse(fileText);
        return browser.storage.local.clear().then(() => {
            return browser.storage.local.set(data);
        });
    }).then(() => {
        showStatus("Imported backup successfully!");
    }).catch((err) => {
        console.error("Import error:", err);
        showStatus("Error importing backup: " + err);
    });
});
