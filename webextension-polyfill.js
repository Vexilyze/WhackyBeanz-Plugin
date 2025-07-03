// WebExtension Polyfill for Cross-Browser Compatibility
// This ensures that both Chrome and Firefox can use chrome.* API calls

(function() {
    'use strict';
    
    // Firefox: Create chrome namespace from browser namespace
    if (typeof chrome === 'undefined' && typeof browser !== 'undefined') {
        window.chrome = {
            storage: {
                local: {
                    get: function(keys, callback) {
                        browser.storage.local.get(keys).then(callback);
                    },
                    set: function(items, callback) {
                        browser.storage.local.set(items).then(() => {
                            if (callback) callback();
                        });
                    },
                    remove: function(keys, callback) {
                        browser.storage.local.remove(keys).then(() => {
                            if (callback) callback();
                        });
                    },
                    clear: function(callback) {
                        browser.storage.local.clear().then(() => {
                            if (callback) callback();
                        });
                    }
                }
            },
            runtime: {
                onMessage: browser.runtime.onMessage,
                getURL: browser.runtime.getURL
            },
            tabs: {
                create: function(createProperties, callback) {
                    browser.tabs.create(createProperties).then(callback);
                },
                query: function(queryInfo, callback) {
                    browser.tabs.query(queryInfo).then(callback);
                },
                update: function(tabId, updateProperties, callback) {
                    browser.tabs.update(tabId, updateProperties).then(callback);
                }
            }
        };
    }
    
    // Chrome: chrome.* APIs exist natively, no polyfill needed
})(); 