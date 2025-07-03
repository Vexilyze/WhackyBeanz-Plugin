/********************************************************************
 * Polyfill so 'browser' calls work in Firefox and 'chrome' calls
 * remain valid in Chrome. If you strictly only want Firefox,
 * replace all 'chrome' references with 'browser' and use promises.
 ********************************************************************/



if (typeof browser === 'undefined') {
    var browser = chrome;
}

/**
 * Safe initialization with React compatibility
 */
function safeInit() {
    try {
        // Run on flames calculator, equipment setup, and symbols pages
        if (window.location.pathname.includes('/calc/equips/flames') || 
            window.location.pathname.includes('/calc/equips/setup') ||
            window.location.pathname.includes('/calc/symbols')) {
            initExtension();
        }
    } catch (error) {
        console.error('[WhackyBeanz Extension] Error in safeInit:', error);
    }
}

/**
 * If DOM is already loaded, run init now; otherwise wait for DOMContentLoaded.
 */
if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(safeInit, 100); // Small delay for React hydration
} else {
    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(safeInit, 100);
    });
}

// Also listen for navigation changes (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        if (url.includes('/calc/equips/flames') || url.includes('/calc/equips/setup') || url.includes('/calc/symbols')) {
            setTimeout(safeInit, 500); // Longer delay for page transitions
        }
    }
}).observe(document, { subtree: true, childList: true });

/**
 * Main initialization function
 */
function initExtension() {
    try {
        // Check if we're on a supported calculator page
        const isFlamesPage = window.location.pathname.includes('/calc/equips/flames');
        const isSetupPage = window.location.pathname.includes('/calc/equips/setup');
        const isSymbolsPage = window.location.pathname.includes('/calc/symbols');
        
        if (isFlamesPage || isSetupPage || isSymbolsPage) {
            // For setup or symbols page, try immediate injection if basic elements are present
            if ((isSetupPage || isSymbolsPage) && document.readyState === 'complete') {
                const quickCheck = document.querySelector('main') && document.querySelector('h1, h2, p');
                if (quickCheck) {
                    setTimeout(() => {
                        try {
                            injectCharacterManagement();
                            renumberExistingSteps();
                            setTimeout(() => {
                                injectPluginSettings();
                            }, 1000);
                        } catch (error) {
                            console.error('[WhackyBeanz Extension] Error during quick injection:', error);
                        }
                    }, 300);
                    return;
                }
            }
            
            // Wait for React to finish initial rendering/hydration
            waitForReactStability(() => {
                try {
                    // Small delay for different pages to let React settle
                    const delay = (isSetupPage || isSymbolsPage) ? 1000 : 500;
                    
                    setTimeout(() => {
                        // Character management and step renumbering for both pages
                        injectCharacterManagement();
                        renumberExistingSteps();
                        
                        // Flame-specific features only on flames page
                        if (isFlamesPage) {
                            injectFlameSolver();
                        }
                        
                        // Plugin settings for both pages
                        setTimeout(() => {
                            injectPluginSettings();
                            
                            // Expand flames table only on flames page
                            if (isFlamesPage) {
                                setTimeout(() => {
                                    initExpandFlamesTable();
                                }, 100);
                            }
                        }, 1500);
                    }, delay);
                } catch (error) {
                    console.error('[WhackyBeanz Extension] Error during injection:', error);
                }
            });
        }
    } catch (error) {
        console.error('[WhackyBeanz Extension] Error in initExtension:', error);
    }
}

/**
 * Wait for React to finish hydration and stabilize before injecting
 */
function waitForReactStability(callback) {
    let attempts = 0;
    const maxAttempts = 30; // Reduced from 50 to 30 (3 seconds instead of 5)
    const checkInterval = 100;

    function checkStability() {
        attempts++;
        
        // Check if React has finished hydration by looking for page-specific elements
        const isFlamesPage = window.location.pathname.includes('/calc/equips/flames');
        const isSetupPage = window.location.pathname.includes('/calc/equips/setup');
        const isSymbolsPage = window.location.pathname.includes('/calc/symbols');
        
        let isReactReady = false;
        
        if (isFlamesPage) {
            // For flames page, check for flames table and main content area
            const mainContentArea = document.querySelector('div.w-full.lg\\:w-9\\/12.relative.lg\\:pl-6.px-2');
            const flameTable = document.querySelector('table');
            isReactReady = mainContentArea && flameTable && document.readyState === 'complete';
        } else if (isSetupPage) {
            // For setup page, check for main content and job selection UI
            const mainContentArea = document.querySelector('main') || document.querySelector('div.w-full.lg\\:w-9\\/12.relative.lg\\:pl-6.px-2');
            
            // Look for job selection text or grid layout
            let jobSelectionArea = null;
            const paragraphs = document.querySelectorAll('p');
            for (const p of paragraphs) {
                if (p.textContent.includes('Select your job type') || p.textContent.includes('1)')) {
                    jobSelectionArea = p;
                    break;
                }
            }
            
            // Fallback to looking for grid or mb-8 divs
            if (!jobSelectionArea) {
                jobSelectionArea = document.querySelector('[class*="grid"][class*="justify-items-center"]') ||
                                 document.querySelector('div[class*="mb-8"]');
            }
            
            isReactReady = mainContentArea && jobSelectionArea && document.readyState === 'complete';
        } else if (isSymbolsPage) {
            // For symbols page, check for main content and progress tracker elements
            const mainContentArea = document.querySelector('main') || document.querySelector('article');
            
            // Look for Progress Tracker heading or symbol selection elements
            let progressTrackerArea = null;
            const headings = document.querySelectorAll('h1, h2, h3');
            for (const h of headings) {
                if (h.textContent.includes('Progress Tracker') || h.textContent.includes('Symbols')) {
                    progressTrackerArea = h;
                    break;
                }
            }
            
            // Fallback to looking for symbol selection or loading elements
            if (!progressTrackerArea) {
                progressTrackerArea = document.querySelector('select') ||
                                    document.querySelector('[class*="Loading"]') ||
                                    document.querySelector('div[class*="mb-8"]');
            }
            
            isReactReady = mainContentArea && progressTrackerArea && document.readyState === 'complete';
        } else {
            // For other pages, just check basic readiness
            isReactReady = document.readyState === 'complete';
        }
        
        if (isReactReady) {
            // Wait a bit more to ensure React has settled
            setTimeout(callback, 200);
        } else if (attempts < maxAttempts) {
            setTimeout(checkStability, checkInterval);
        } else {
            console.warn('[WhackyBeanz Extension] Timeout waiting for React stability, proceeding anyway');
            callback();
        }
    }
    
    // Start checking after initial delay
    setTimeout(checkStability, 500);
}

// Listen for messages from the popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getLocalStorage") {
        const localStorageData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            localStorageData[key] = localStorage.getItem(key);
        }
        sendResponse({ localStorageData });
        return true; // Keep sendResponse channel open
    }

    else if (request.action === "setLocalStorage") {
        localStorage.clear();
        const dataToRestore = request.data || {};
        for (const [key, val] of Object.entries(dataToRestore)) {
            localStorage.setItem(key, val);
        }
        sendResponse({ status: "ok" });
        return true;
    }

    else if (request.action === "toggleFlamesHeight") {
        toggleFlamesHeight(request.enable);
        sendResponse({ status: "ok" });
        return true;
    }

    else if (request.action === "flameSolver") {
        // We now read STR, DEX, INT, LUK, ALL, ATT, MATT (some might be 0 if not used)
        const {
            STR = 0,
            DEX = 0,
            INT = 0,
            LUK = 0,
            ALL = 0,
            ATT = 0,
            MATT = 0
        } = request.data;

        // 1) solve with 7 dimensions
        const solutions = solveFlamesDynamic(STR, DEX, INT, LUK, ALL, ATT, MATT);
        if (!solutions || solutions.length === 0) {
            sendResponse({ status: "noSolution" });
        } else {
            // pick the first solution
            const best = solutions[0];
            applySolution(best);
            sendResponse({ status: "ok", solution: best });
        }
        return true;
    }
});



/**
 * Replaces 'max-h-[305px]' with 'max-h-[625px]' if enable=true,
 * or reverts to 'max-h-[305px]' if enable=false.
 */
function toggleFlamesHeight(enable) {
    const container = document.querySelector(
        "div.text-sm.sm\\:px-4.md\\:px-8.grid.auto-cols-fr.overflow-auto.mb-4"
    );
    if (!container) return;

    container.classList.remove("max-h-[305px]", "max-h-[625px]");
    if (enable) {
        container.classList.add("max-h-[625px]");
    } else {
        container.classList.add("max-h-[305px]");
    }
}

/*******************************************************************
 * parseFlameLines() - Step 1: gather the possible tier values from
 * the DOM for each line
 ******************************************************************/
function parseFlameLines() {
    const lineNames = [
        "str", "dex", "int", "luk",
        "strDex", "strInt", "strLuk",
        "dexInt", "dexLuk", "intLuk",
        "allStatsPercent",
        "armorAtt",
        "armorMatt"
    ];

    const flameData = {};
    for (let name of lineNames) {
        const inputs = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
        const vals = [];
        inputs.forEach((inp) => {
            const num = Number(inp.value);
            if (!isNaN(num)) vals.push(num);
        });
        flameData[name] = vals;
    }
    return flameData;
}

/********************************************************************
 * solveFlamesDynamic(STR,DEX,INT,LUK,ALL,ATT,MATT):
 * BFS/DFS approach, up to 4 lines, no repeats, tries to EXACT match
 ********************************************************************/
function solveFlamesDynamic(strTarget, dexTarget, intTarget, lukTarget, allTarget, attTarget, mattTarget) {
    const flameData = parseFlameLines();
    const lineDefs = Object.keys(flameData).map((lineName) => ({
        name: lineName,
        tierValues: flameData[lineName]
    }));

    const solutions = [];

    function getVec(lineName, val) {
        switch(lineName) {
            case "str": return { str: val, dex:0, int:0, luk:0, all:0, att:0, matt:0 };
            case "dex": return { str:0, dex: val, int:0, luk:0, all:0, att:0, matt:0 };
            case "int": return { str:0, dex:0, int: val, luk:0, all:0, att:0, matt:0 };
            case "luk": return { str:0, dex:0, int:0, luk: val, all:0, att:0, matt:0 };

            case "strDex": return { str: val, dex: val, int:0, luk:0, all:0, att:0, matt:0 };
            case "strInt": return { str: val, dex:0, int: val, luk:0, all:0, att:0, matt:0 };
            case "strLuk": return { str: val, dex:0, int:0, luk: val, all:0, att:0, matt:0 };
            case "dexInt": return { str:0, dex: val, int: val, luk:0, all:0, att:0, matt:0 };
            case "dexLuk": return { str:0, dex: val, int:0, luk: val, all:0, att:0, matt:0 };
            case "intLuk": return { str:0, dex:0, int: val, luk: val, all:0, att:0, matt:0 };

            case "allStatsPercent":
                return { str:0, dex:0, int:0, luk:0, all: val, att:0, matt:0 };

            case "armorAtt":
                return { str:0, dex:0, int:0, luk:0, all:0, att: val, matt:0 };

            case "armorMatt":
                return { str:0, dex:0, int:0, luk:0, all:0, att:0, matt: val };

            default:
                return { str:0, dex:0, int:0, luk:0, all:0, att:0, matt:0 };
        }
    }

    function backtrack(picks, usedLines, sStr, sDex, sInt, sLuk, sAll, sAtt, sMatt) {
        // If we match all 7 exactly
        if (
            sStr === strTarget &&
            sDex === dexTarget &&
            sInt === intTarget &&
            sLuk === lukTarget &&
            sAll === allTarget &&
            sAtt === attTarget &&
            sMatt === mattTarget
        ) {
            solutions.push([...picks]);
            return;
        }

        // limit to 4 lines
        if (picks.length >= 4) return;

        // prune if any dimension goes over
        if (
            sStr > strTarget || sDex > dexTarget || sInt > intTarget || sLuk > lukTarget ||
            sAll > allTarget || sAtt > attTarget || sMatt > mattTarget
        ) {
            return;
        }

        for (let line of lineDefs) {
            if (usedLines.has(line.name)) continue;  // no repeats

            for (let val of line.tierValues) {
                const vec = getVec(line.name, val);
                const nStr  = sStr  + vec.str;
                const nDex  = sDex  + vec.dex;
                const nInt  = sInt  + vec.int;
                const nLuk  = sLuk  + vec.luk;
                const nAll  = sAll  + vec.all;
                const nAtt  = sAtt  + vec.att;
                const nMatt = sMatt + vec.matt;

                picks.push({ lineName: line.name, tierValue: val });
                usedLines.add(line.name);

                backtrack(picks, usedLines, nStr, nDex, nInt, nLuk, nAll, nAtt, nMatt);

                picks.pop();
                usedLines.delete(line.name);
            }
        }
    }

    backtrack([], new Set(), 0,0,0,0,0,0,0);
    return solutions;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function hasAllClasses(labelElement, requiredClasses) {
    const labelClassList = labelElement.classList;
    return requiredClasses.every(cls => labelClassList.contains(cls));
}

async function applySolution(solutionArr) {
    const requiredClasses = [
        "bg-sky-800/40",
        "dark:bg-blue-300/70"
    ];

    // 1) Unselect lines that have these highlight classes
    const allRadios = document.querySelectorAll('input[type="radio"]');
    for (const radio of allRadios) {
        const label = document.querySelector(`label[for="${radio.id}"]`);
        if (!label) continue;

        if (hasAllClasses(label, requiredClasses)) {
            label.dispatchEvent(new PointerEvent("pointerdown", {
                bubbles: true, cancelable: true, composed: true, pointerId: 1, pointerType: "mouse"
            }));
            label.dispatchEvent(new PointerEvent("pointerup", {
                bubbles: true, cancelable: true, composed: true, pointerId: 1, pointerType: "mouse"
            }));
            label.dispatchEvent(new MouseEvent("click", {
                bubbles: true, cancelable: true
            }));
            await sleep(100);
        }
    }
    await sleep(100);

    // 2) Check the new picks
    for (const pick of solutionArr) {
        const selector = `input[type="radio"][name="${pick.lineName}"][value="${pick.tierValue}"]`;
        const radio = document.querySelector(selector);
        if (!radio) continue;

        const label = document.querySelector(`label[for="${radio.id}"]`);
        if (label) {
            label.dispatchEvent(new PointerEvent("pointerdown", {
                bubbles: true, cancelable: true, composed: true, pointerId: 1, pointerType: "mouse"
            }));
            label.dispatchEvent(new PointerEvent("pointerup", {
                bubbles: true, cancelable: true, composed: true, pointerId: 1, pointerType: "mouse"
            }));
            label.dispatchEvent(new MouseEvent("click", {
                bubbles: true, cancelable: true
            }));
        } else {
            radio.dispatchEvent(new PointerEvent("pointerdown", {
                bubbles: true, cancelable: true, composed: true, pointerId: 1, pointerType: "mouse"
            }));
            radio.dispatchEvent(new PointerEvent("pointerup", {
                bubbles: true, cancelable: true, composed: true, pointerId: 1, pointerType: "mouse"
            }));
            radio.dispatchEvent(new MouseEvent("click", {
                bubbles: true, cancelable: true
            }));
        }
        await sleep(100);
    }
}

/********************************************************************
 * Character Management System - Inject UI into flames page
 ********************************************************************/

/**
 * Inject character management section as new Step 1
 */
function injectCharacterManagement() {
    try {
        // Check if already injected to prevent duplicates
        if (document.querySelector('.whackybeanz-character-section')) {
            return;
        }

        // Check if we're on the symbols page for different content area detection
        const isSymbolsPage = window.location.pathname.includes('/calc/symbols');
        
        let mainContentArea = null;
        
        if (isSymbolsPage) {
            // For symbols page, target the specific content area with the class pattern shown
            mainContentArea = document.querySelector('div.w-full.lg\\:w-9\\/12.relative.lg\\:pl-6') ||
                             document.querySelector('div.w-full.lg\\:w-9\\/12.relative') ||
                             document.querySelector('main') ||
                             document.querySelector('article');
        } else {
            // For flames and setup pages, use the original selector  
            mainContentArea = document.querySelector('div.w-full.lg\\:w-9\\/12.relative.lg\\:pl-6.px-2');
        }
        
        if (!mainContentArea) {
            // Try alternative selectors for any page
            const alternatives = [
                'main',
                'div[class*="w-full"]',
                'div[class*="lg:w-9"]',
                '.container',
                'article',
                'body > div',
                '#__next',
                '[role="main"]'
            ];
            
            for (const selector of alternatives) {
                const alt = document.querySelector(selector);
                if (alt) {
                    mainContentArea = alt;
                    break;
                }
            }
            
            if (!mainContentArea) {
                return;
            }
        }

        let targetStep = null;
        
        if (isSymbolsPage) {
            // For symbols page, specifically target the h2 with "Progress Tracker" text
            const progressTrackerH2 = mainContentArea.querySelector('h2');
            if (progressTrackerH2 && progressTrackerH2.textContent.includes('Progress Tracker')) {
                // Insert directly before the Progress Tracker h2 element
                targetStep = progressTrackerH2;
            } else {
                // Fallback: look for any h2 element
                targetStep = mainContentArea.querySelector('h2') || 
                           mainContentArea.querySelector('h1') ||
                           mainContentArea;
            }
        } else {
            // For flames and setup pages, find step numbering
            const stepElements = mainContentArea.querySelectorAll('p');
            
            for (let i = 0; i < stepElements.length; i++) {
                const p = stepElements[i];
                const text = p.textContent.trim();
                
                // Look for common step patterns on both flames and setup pages
                if (text.includes('Select an item part') || 
                    text.includes('Select an item') || 
                    text.includes('Select an equipment') ||
                    text.includes('Choose your equipment') ||
                    text.includes('Select your job type') ||
                    text.startsWith('1)') ||
                    (text.match(/^\d+\)\s+/) && !text.includes('character'))) {
                    
                    // Find the parent container of this step
                    targetStep = p.closest('div.mb-8');
                    
                    if (targetStep) {
                        break;
                    } else {
                        // Try alternative parent selectors
                        targetStep = p.closest('div') || p.parentElement;
                        
                        if (targetStep && (targetStep.classList.contains('mb-8') || targetStep.classList.contains('mb-'))) {
                            break;
                        } else {
                            // Use the paragraph itself as container if no good parent found
                            targetStep = p;
                            break;
                        }
                    }
                }
            }
        }
        
        if (!targetStep) {
            // Fallback: use the first div.mb-8 in the main content area
            targetStep = mainContentArea.querySelector('div.mb-8');
            
            if (!targetStep) {
                // Try using the main content area itself as fallback
                targetStep = mainContentArea;
            }
        }

        // Create character management section
        const characterSection = document.createElement('div');
        characterSection.className = 'mb-8 whackybeanz-character-section';

        // Different intro text based on page type
        const introText = isSymbolsPage 
            ? "Select or create a character to manage your symbol progress data."
            : "1) Select or create a character to manage your equipment and flame data.";

        characterSection.innerHTML = `
            <p class="mb-4">${introText}</p>
            <div class="sm:px-4 md:px-8">
                
                <!-- Character Selection -->
                <div class="mb-6">
                    <h3 class="text-base font-bold mb-4 text-sky-800 dark:text-blue-300">Load Saved Character</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
                        <select 
                            id="whackybeanz-character-dropdown" 
                            class="h-8 rounded-lg px-4 border border-slate-300 dark:border-none dark:bg-zinc-700 focus:outline-none focus:border-sky-800 dark:focus:border-blue-300 text-sm"
                        >
                            <option value="">Select a character...</option>
                        </select>
                        <div class="flex gap-2">
                            <button 
                                id="whackybeanz-loadCharacterBtn" 
                                class="h-8 flex items-center justify-center border-2 border-sky-800 dark:border-blue-300 bg-sky-50 dark:bg-zinc-800 text-sky-800 dark:text-blue-300 hover:bg-sky-800 hover:text-sky-50 dark:hover:text-black dark:hover:bg-blue-300 rounded-lg transition-all duration-200 px-3 text-sm"
                                disabled
                            >
                                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" class="mr-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M307 34.8c-11.5 5.1-19 16.6-19 29.2v64H176C78.8 128 0 206.8 0 304C0 417.3 81.5 467.9 100.2 478.1c2.5 1.4 5.3 1.9 8.1 1.9c10.9 0 19.7-8.9 19.7-19.7c0-7.5-4.3-14.4-9.8-19.5C108.8 431.9 96 414.4 96 384c0-53 43-96 96-96h96v64c0 12.6 7.4 24.1 19 29.2s25 3 34.4-5.4l160-144c6.7-6.1 10.6-14.7 10.6-23.8s-3.8-17.7-10.6-23.8l-160-144c-9.4-8.5-22.9-10.6-34.4-5.4z"></path>
                                </svg>
                                Load
                            </button>
                            <button 
                                id="whackybeanz-updateCharacterBtn" 
                                class="h-8 flex items-center justify-center border-2 border-amber-700 dark:border-yellow-500 bg-amber-50 dark:bg-zinc-800 text-amber-700 dark:text-yellow-500 hover:bg-amber-800 hover:text-amber-50 dark:hover:text-black dark:hover:bg-yellow-300 rounded-lg transition-all duration-200 px-3 text-sm"
                                disabled
                            >
                                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" class="mr-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M142.9 142.9c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5c0 0 0 0 0 0H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5c7.7-21.8 20.2-42.3 37.8-59.8zM16 312v7.6 .7V440c0 9.7 5.8 18.5 14.8 22.2s19.3 1.7 26.2-5.2L98.6 415.4c87.6 86.5 228.7 86.2 315.8-1C438.8 390 456.4 361.3 467.2 330.6c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.2 62.2-162.7 62.5-225.3 1L185 329c6.9-6.9 8.9-17.2 5.2-26.2s-12.5-14.8-22.2-14.8H48.4h-.7H40c-13.3 0-24 10.7-24 24z"></path>
                                </svg>
                                Update
                            </button>
                            <button 
                                id="whackybeanz-deleteCharacterBtn" 
                                class="h-8 flex items-center justify-center border-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-zinc-800 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-red-50 dark:hover:text-black dark:hover:bg-red-400 rounded-lg transition-all duration-200 px-3 text-sm"
                                disabled
                            >
                                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" class="mr-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path>
                                </svg>
                                Delete
                            </button>
                        </div>
                    </div>

                    <!-- Delete confirmation block -->
                    <div id="whackybeanz-deleteConfirm" class="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 hidden">
                        <p class="text-sm mb-3 text-red-800 dark:text-red-200">Are you sure you want to delete this character? This action cannot be undone.</p>
                        <div class="flex gap-2">
                            <button 
                                id="whackybeanz-confirmDeleteBtn" 
                                class="h-8 flex items-center justify-center bg-red-600 text-white hover:bg-red-700 rounded-lg transition-all duration-200 px-3 text-sm"
                            >
                                Yes, Delete
                            </button>
                            <button 
                                id="whackybeanz-cancelDeleteBtn" 
                                class="h-8 flex items-center justify-center bg-gray-500 text-white hover:bg-gray-600 rounded-lg transition-all duration-200 px-3 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Create New Character -->
                <div class="mb-6 mt-8">
                    <h3 class="text-base font-bold mb-4 text-sky-800 dark:text-blue-300">Create New Character</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
                        <input 
                            type="text" 
                            id="whackybeanz-newCharacterName" 
                            placeholder="Enter character name" 
                            class="h-8 rounded-lg px-4 border border-slate-300 dark:border-none dark:bg-zinc-700 focus:outline-none focus:border-sky-800 dark:focus:border-blue-300 text-sm"
                        />
                        <button 
                            id="whackybeanz-saveCharacterBtn" 
                            class="h-8 flex items-center justify-center border-2 border-green-600 dark:border-green-400 bg-green-50 dark:bg-zinc-800 text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-green-50 dark:hover:text-black dark:hover:bg-green-400 rounded-lg transition-all duration-200 px-3 text-sm"
                        >
                            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" class="mr-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                <path d="M433.941 129.941l-83.882-83.882A48 48 0 0 0 316.118 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V163.882a48 48 0 0 0-14.059-33.941zM224 416c-35.346 0-64-28.654-64-64 0-35.346 28.654-64 64-64s64 28.654 64 64c0 35.346-28.654 64-64 64zm96-304.52V212c0 6.627-5.373 12-12 12H76c-6.627 0-12-5.373-12-12V108c0-6.627 5.373-12 12-12h228.52c3.183 0 6.235 1.264 8.485 3.515l3.48 3.48A11.996 11.996 0 0 1 320 111.48z"></path>
                            </svg>
                            Save Character
                        </button>
                    </div>
                </div>

                <!-- Status Messages -->
                <div id="whackybeanz-characterStatusMessage" class="text-center text-sm font-medium hidden">
                    <!-- Status messages will appear here -->
                </div>
            </div>
        `;

        // Insert before the target step (which will become step 2)
        try {
            if (targetStep === mainContentArea) {
                // If target is the main content area, insert at the beginning
                mainContentArea.insertBefore(characterSection, mainContentArea.firstChild);
            } else {
                // Normal insertion before the target step
                targetStep.parentNode.insertBefore(characterSection, targetStep);
            }
        } catch (insertError) {
            console.error('[WhackyBeanz Extension] Error during insertion:', insertError);
            // Fallback: append to main content area
            mainContentArea.appendChild(characterSection);
        }

        // Initialize character management functionality
        initCharacterManagement();

    } catch (error) {
        console.error('[WhackyBeanz Extension] Error injecting character management:', error);
    }
}

/**
 * Inject flame solver section
 */
function injectFlameSolver(retryCount = 0) {
    try {
        // Check if already injected to prevent duplicates
        if (document.querySelector('.whackybeanz-flame-solver-section')) {
            return;
        }

        // Find the main content area
        const mainContentArea = document.querySelector('div.w-full.lg\\:w-9\\/12.relative.lg\\:pl-6.px-2');
        if (!mainContentArea) {
            return;
        }

        // If equipment setup step doesn't exist yet, set up a delayed retry
        const equipmentStepText = 'If you have a saved equipment setup';
        const hasEquipmentStep = Array.from(mainContentArea.querySelectorAll('p')).some(p => 
            p.textContent.includes(equipmentStepText) && p.textContent.includes('select your equipment\'s current flame values')
        );
        
        if (!hasEquipmentStep) {
            if (retryCount < 3) {
                setTimeout(() => injectFlameSolver(retryCount + 1), 2000);
                return;
            }
        }

        // Find the specific paragraph containing the equipment setup step text
        let targetLocation = null;
        const allParagraphs = mainContentArea.querySelectorAll('p');
        
        for (let paragraph of allParagraphs) {
            const text = paragraph.textContent.trim();
            // Look for the key phrase about saved equipment setup, regardless of step number
            if (text.includes('If you have a saved equipment setup') && text.includes('select your equipment\'s current flame values')) {
                // Found the equipment setup step paragraph, insert after this specific paragraph
                targetLocation = paragraph;
                break;
            }
        }
        
        // Fallback positioning if equipment setup step is not found
        if (!targetLocation) {
            const allSteps = mainContentArea.querySelectorAll('div.mb-8, div.mb-12');
            const extrasSection = mainContentArea.querySelector('div.border-2.border-slate-300.dark\\:border-zinc-700');
            const flameTable = mainContentArea.querySelector('table');
            
            if (extrasSection) {
                targetLocation = extrasSection.parentElement;
            } else if (flameTable) {
                targetLocation = flameTable.closest('div.mb-12') || flameTable.closest('div.mb-8');
            } else if (allSteps.length > 0) {
                targetLocation = allSteps[allSteps.length - 1];
            } else {
                targetLocation = mainContentArea.lastElementChild;
            }
        }
        
        if (!targetLocation) {
            return;
        }

        // Create flame solver section with collapsible interface
        const flameSolverSection = document.createElement('div');
        flameSolverSection.className = 'mb-8 whackybeanz-flame-solver-section';

        flameSolverSection.innerHTML = `
            <!-- Flame Solver Controls -->
            <div class="mb-4 flex flex-col sm:flex-row gap-4 items-start">
                <button 
                    id="whackybeanz-flame-solver-toggle" 
                    class="h-10 flex items-center justify-center border-2 border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-zinc-800 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-purple-50 dark:hover:text-black dark:hover:bg-purple-400 rounded-lg transition-all duration-200 px-4 text-sm font-medium"
                >
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" class="mr-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"></path>
                    </svg>
                    🔥 Open Flame Solver
                </button>
                
                <!-- Expand Flames Table Option -->
                <div class="flex items-center">
                    <label
                        for="whackybeanz-expandFlamesCheck"
                        class="inline-flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-zinc-800 rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all duration-200 text-sm"
                    >
                        <input
                            type="checkbox"
                            id="whackybeanz-expandFlamesCheck"
                            class="cursor-pointer h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span class="select-none text-gray-700 dark:text-gray-300">Expand Flames Table</span>
                    </label>
                </div>
            </div>

            <!-- Collapsible Flame Solver Interface -->
            <div id="whackybeanz-flame-solver-panel" class="hidden">
                <div class="border-2 border-slate-300 dark:border-zinc-700 rounded-lg py-4 px-4 bg-white dark:bg-zinc-900">
                    <!-- Header with Close Button -->
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-lg font-bold text-sky-800 dark:text-blue-300">🔥 Flame Solver</h2>
                        <button 
                            id="whackybeanz-flame-solver-close" 
                            class="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                            title="Close Flame Solver"
                        >
                            <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1.2em" width="1.2em" xmlns="http://www.w3.org/2000/svg">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    
                    <p class="mb-4 text-sm text-gray-600 dark:text-gray-300">Enter your desired stat values and the solver will find the optimal flame line combination to achieve them.</p>
                    
                    <div class="sm:px-4 md:px-8">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            <!-- Pure Stats Column -->
                            <div>
                                <h4 class="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Pure Stats</h4>
                                <div class="space-y-3">
                                    <div class="grid grid-cols-[60px_1fr] items-center gap-2">
                                        <label for="whackybeanz-solver-str" class="text-sm font-medium">STR:</label>
                                        <input 
                                            type="number" 
                                            id="whackybeanz-solver-str" 
                                            placeholder="0"
                                            class="h-8 rounded-lg px-3 border border-slate-300 dark:border-none dark:bg-zinc-700 focus:outline-none focus:border-sky-800 dark:focus:border-blue-300 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                    <div class="grid grid-cols-[60px_1fr] items-center gap-2">
                                        <label for="whackybeanz-solver-dex" class="text-sm font-medium">DEX:</label>
                                        <input 
                                            type="number" 
                                            id="whackybeanz-solver-dex" 
                                            placeholder="0"
                                            class="h-8 rounded-lg px-3 border border-slate-300 dark:border-none dark:bg-zinc-700 focus:outline-none focus:border-sky-800 dark:focus:border-blue-300 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                    <div class="grid grid-cols-[60px_1fr] items-center gap-2">
                                        <label for="whackybeanz-solver-int" class="text-sm font-medium">INT:</label>
                                        <input 
                                            type="number" 
                                            id="whackybeanz-solver-int" 
                                            placeholder="0"
                                            class="h-8 rounded-lg px-3 border border-slate-300 dark:border-none dark:bg-zinc-700 focus:outline-none focus:border-sky-800 dark:focus:border-blue-300 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                    <div class="grid grid-cols-[60px_1fr] items-center gap-2">
                                        <label for="whackybeanz-solver-luk" class="text-sm font-medium">LUK:</label>
                                        <input 
                                            type="number" 
                                            id="whackybeanz-solver-luk" 
                                            placeholder="0"
                                            class="h-8 rounded-lg px-3 border border-slate-300 dark:border-none dark:bg-zinc-700 focus:outline-none focus:border-sky-800 dark:focus:border-blue-300 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <!-- Attack Stats Column -->
                            <div>
                                <h4 class="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Attack Stats</h4>
                                <div class="space-y-3">
                                    <div class="grid grid-cols-[60px_1fr] items-center gap-2">
                                        <label for="whackybeanz-solver-att" class="text-sm font-medium">ATT:</label>
                                        <input 
                                            type="number" 
                                            id="whackybeanz-solver-att" 
                                            placeholder="0"
                                            class="h-8 rounded-lg px-3 border border-slate-300 dark:border-none dark:bg-zinc-700 focus:outline-none focus:border-sky-800 dark:focus:border-blue-300 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                    <div class="grid grid-cols-[60px_1fr] items-center gap-2">
                                        <label for="whackybeanz-solver-matt" class="text-sm font-medium">MATT:</label>
                                        <input 
                                            type="number" 
                                            id="whackybeanz-solver-matt" 
                                            placeholder="0"
                                            class="h-8 rounded-lg px-3 border border-slate-300 dark:border-none dark:bg-zinc-700 focus:outline-none focus:border-sky-800 dark:focus:border-blue-300 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <!-- Percentage Stats Column -->
                            <div>
                                <h4 class="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Percentage Stats</h4>
                                <div class="space-y-3">
                                    <div class="grid grid-cols-[60px_1fr] items-center gap-2">
                                        <label for="whackybeanz-solver-all" class="text-sm font-medium">All %:</label>
                                        <input 
                                            type="number" 
                                            id="whackybeanz-solver-all" 
                                            placeholder="0"
                                            class="h-8 rounded-lg px-3 border border-slate-300 dark:border-none dark:bg-zinc-700 focus:outline-none focus:border-sky-800 dark:focus:border-blue-300 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Solve Button and Results -->
                        <div class="border-t border-slate-200 dark:border-zinc-600 pt-4">
                            <div class="flex flex-col sm:flex-row gap-4 items-start">
                                <div class="flex gap-2">
                                    <button 
                                        id="whackybeanz-solve-btn" 
                                        class="h-10 flex items-center justify-center border-2 border-green-600 dark:border-green-400 bg-green-50 dark:bg-zinc-800 text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-green-50 dark:hover:text-black dark:hover:bg-green-400 rounded-lg transition-all duration-200 px-6 text-sm font-medium"
                                    >
                                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" class="mr-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"></path>
                                        </svg>
                                        Solve Flames
                                    </button>
                                    <button 
                                        id="whackybeanz-clear-btn" 
                                        class="h-10 flex items-center justify-center border-2 border-gray-500 dark:border-gray-400 bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-500 hover:text-gray-50 dark:hover:text-black dark:hover:bg-gray-400 rounded-lg transition-all duration-200 px-4 text-sm font-medium"
                                    >
                                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" class="mr-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path>
                                        </svg>
                                        Clear
                                    </button>
                                </div>
                                
                                <!-- Results area -->
                                <div id="whackybeanz-solver-results" class="flex-1 text-sm hidden">
                                    <div id="whackybeanz-solver-success" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 hidden">
                                        <h5 class="font-semibold text-green-800 dark:text-green-200 mb-2">✅ Solution Found!</h5>
                                        <p class="text-green-700 dark:text-green-300 mb-2">The flame lines have been automatically selected on the page.</p>
                                        <div id="whackybeanz-solution-details" class="text-xs text-green-600 dark:text-green-400"></div>
                                    </div>
                                    
                                    <div id="whackybeanz-solver-error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 hidden">
                                        <h5 class="font-semibold text-red-800 dark:text-red-200 mb-2">❌ No Solution Found</h5>
                                        <p class="text-red-700 dark:text-red-300">No combination of flame lines can achieve the exact values you specified. Try adjusting your target values.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert after the target location (equipment setup step text)
        if (targetLocation.nextSibling) {
            targetLocation.parentNode.insertBefore(flameSolverSection, targetLocation.nextSibling);
        } else {
            targetLocation.parentNode.appendChild(flameSolverSection);
        }

        // Initialize flame solver events
        initFlameSolverEvents();

    } catch (error) {
        console.error('[WhackyBeanz Extension] Error injecting flame solver:', error);
    }
}

/**
 * Initialize flame solver event handlers
 */
function initFlameSolverEvents() {
    const toggleBtn = document.getElementById('whackybeanz-flame-solver-toggle');
    const closeBtn = document.getElementById('whackybeanz-flame-solver-close');
    const panel = document.getElementById('whackybeanz-flame-solver-panel');
    const solveBtn = document.getElementById('whackybeanz-solve-btn');
    const clearBtn = document.getElementById('whackybeanz-clear-btn');

    // Toggle flame solver panel
    if (toggleBtn && panel) {
        toggleBtn.addEventListener('click', () => {
            panel.classList.toggle('hidden');
            if (panel.classList.contains('hidden')) {
                toggleBtn.innerHTML = `
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" class="mr-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"></path>
                    </svg>
                    🔥 Open Flame Solver
                `;
            } else {
                toggleBtn.innerHTML = `
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" class="mr-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"></path>
                    </svg>
                    🔥 Close Flame Solver
                `;
            }
        });
    }

    // Close flame solver panel
    if (closeBtn && panel) {
        closeBtn.addEventListener('click', () => {
            panel.classList.add('hidden');
            if (toggleBtn) {
                toggleBtn.innerHTML = `
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" class="mr-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"></path>
                    </svg>
                    🔥 Open Flame Solver
                `;
            }
        });
    }

    // Clear button functionality
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            // Clear all input fields
            document.getElementById('whackybeanz-solver-str').value = '';
            document.getElementById('whackybeanz-solver-dex').value = '';
            document.getElementById('whackybeanz-solver-int').value = '';
            document.getElementById('whackybeanz-solver-luk').value = '';
            document.getElementById('whackybeanz-solver-att').value = '';
            document.getElementById('whackybeanz-solver-matt').value = '';
            document.getElementById('whackybeanz-solver-all').value = '';
            
            // Hide results
            document.getElementById('whackybeanz-solver-results').classList.add('hidden');
            document.getElementById('whackybeanz-solver-success').classList.add('hidden');
            document.getElementById('whackybeanz-solver-error').classList.add('hidden');
        });
    }

    // Solve button functionality
    if (!solveBtn) return;

    solveBtn.addEventListener('click', async () => {
        try {
            // Get input values
            const strVal = Number(document.getElementById('whackybeanz-solver-str').value) || 0;
            const dexVal = Number(document.getElementById('whackybeanz-solver-dex').value) || 0;
            const intVal = Number(document.getElementById('whackybeanz-solver-int').value) || 0;
            const lukVal = Number(document.getElementById('whackybeanz-solver-luk').value) || 0;
            const attVal = Number(document.getElementById('whackybeanz-solver-att').value) || 0;
            const mattVal = Number(document.getElementById('whackybeanz-solver-matt').value) || 0;
            const allVal = Number(document.getElementById('whackybeanz-solver-all').value) || 0;

            // Validate input - at least one non-zero value
            if (strVal === 0 && dexVal === 0 && intVal === 0 && lukVal === 0 && attVal === 0 && mattVal === 0 && allVal === 0) {
                showSolverError('Please enter at least one non-zero target value.');
                return;
            }

            // Show loading state
            solveBtn.disabled = true;
            solveBtn.innerHTML = `
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" class="mr-2 animate-spin" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                    <path d="M304 48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z"></path>
                </svg>
                Solving...
            `;

            // Hide previous results
            document.getElementById('whackybeanz-solver-results').classList.add('hidden');
            document.getElementById('whackybeanz-solver-success').classList.add('hidden');
            document.getElementById('whackybeanz-solver-error').classList.add('hidden');

            // Solve with the dynamic solver
            const solutions = solveFlamesDynamic(strVal, dexVal, intVal, lukVal, allVal, attVal, mattVal);
            
            if (!solutions || solutions.length === 0) {
                showSolverError('No combination of flame lines can achieve the exact values you specified. Try adjusting your target values.');
            } else {
                // Apply the first solution
                const best = solutions[0];
                await applySolution(best);
                showSolverSuccess(best);
                
                // Auto-close success message after 4 seconds
                setTimeout(() => {
                    const successDiv = document.getElementById('whackybeanz-solver-success');
                    const resultsDiv = document.getElementById('whackybeanz-solver-results');
                    if (successDiv && !successDiv.classList.contains('hidden')) {
                        successDiv.classList.add('hidden');
                        resultsDiv.classList.add('hidden');
                    }
                }, 4000);
            }

        } catch (error) {
            console.error('[WhackyBeanz Extension] Error in flame solver:', error);
            showSolverError('An error occurred while solving. Please try again.');
        } finally {
            // Restore button state
            solveBtn.disabled = false;
            solveBtn.innerHTML = `
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" class="mr-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                    <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"></path>
                </svg>
                Solve Flames
            `;
        }
    });
}

/**
 * Show solver success message
 */
function showSolverSuccess(solution) {
    const resultsEl = document.getElementById('whackybeanz-solver-results');
    const successEl = document.getElementById('whackybeanz-solver-success');
    const detailsEl = document.getElementById('whackybeanz-solution-details');
    
    if (resultsEl && successEl && detailsEl) {
        // Format solution details
        const details = solution.map(item => `${item.lineName}: ${item.tierValue}`).join(', ');
        detailsEl.textContent = `Lines used: ${details}`;
        
        resultsEl.classList.remove('hidden');
        successEl.classList.remove('hidden');
    }
}

/**
 * Show solver error message
 */
function showSolverError(message) {
    const resultsEl = document.getElementById('whackybeanz-solver-results');
    const errorEl = document.getElementById('whackybeanz-solver-error');
    const errorText = errorEl?.querySelector('p');
    
    if (resultsEl && errorEl) {
        if (errorText && message) {
            errorText.textContent = message;
        }
        
        resultsEl.classList.remove('hidden');
        errorEl.classList.remove('hidden');
    }
}

/**
 * Renumber existing steps (1 becomes 2, 2 becomes 3, etc.)
 * Excludes the character management section from renumbering
 */
function renumberExistingSteps() {
    try {
        // Find all paragraph elements that start with a step number, but exclude the character management section
        const stepElements = document.querySelectorAll('p');
        
        stepElements.forEach(p => {
            try {
                // Skip if this paragraph is inside the character management section
                if (p.closest('.whackybeanz-character-section')) {
                    return;
                }
                
                const text = p.textContent.trim();
                // Match patterns like "1) Select an item..." or "2) Possible flame..."
                const match = text.match(/^(\d+)\)\s+(.+)/);
                if (match) {
                    const currentNumber = parseInt(match[1]);
                    const restOfText = match[2];
                    const newNumber = currentNumber + 1;
                    
                    // Use a more React-friendly way to update text
                    requestAnimationFrame(() => {
                        try {
                            p.textContent = `${newNumber}) ${restOfText}`;
                        } catch (innerError) {
                            console.warn('[WhackyBeanz Extension] Could not update step text:', innerError);
                        }
                    });
                }
            } catch (error) {
                console.warn('[WhackyBeanz Extension] Error processing step element:', error);
            }
        });
    } catch (error) {
        console.error('[WhackyBeanz Extension] Error in renumberExistingSteps:', error);
    }
}

/********************************************************************
 * Character Management JavaScript Functionality
 ********************************************************************/

class ExtensionCharacterManager {
    constructor() {
        this.STORAGE_KEY = 'whackybeanz-characters';
        this.CURRENT_CHARACTER_KEY = 'whackybeanz-current-character';
        this.characters = [];
        this.currentCharacterId = null;
        
        this.initializeElements();
        this.bindEvents();
        this.initialize();
    }

    async initialize() {
        await this.loadCharacters();
        this.populateDropdown();
    }

    initializeElements() {
        // Dropdown and buttons
        this.dropdown = document.getElementById('whackybeanz-character-dropdown');
        this.loadBtn = document.getElementById('whackybeanz-loadCharacterBtn');
        this.updateBtn = document.getElementById('whackybeanz-updateCharacterBtn');
        this.deleteBtn = document.getElementById('whackybeanz-deleteCharacterBtn');
        
        // Create character elements
        this.nameInput = document.getElementById('whackybeanz-newCharacterName');
        this.saveBtn = document.getElementById('whackybeanz-saveCharacterBtn');
        
        // Delete confirmation elements
        this.deleteConfirm = document.getElementById('whackybeanz-deleteConfirm');
        this.confirmDeleteBtn = document.getElementById('whackybeanz-confirmDeleteBtn');
        this.cancelDeleteBtn = document.getElementById('whackybeanz-cancelDeleteBtn');
        
        // Status message element
        this.statusMessage = document.getElementById('whackybeanz-characterStatusMessage');
    }

    bindEvents() {
        // Character dropdown change
        if (this.dropdown) {
            this.dropdown.addEventListener('change', () => this.onDropdownChange());
        }

        // Load character button
        if (this.loadBtn) {
            this.loadBtn.addEventListener('click', () => this.loadCharacter());
        }

        // Update character button
        if (this.updateBtn) {
            this.updateBtn.addEventListener('click', () => this.updateCharacter());
        }

        // Delete character button
        if (this.deleteBtn) {
            this.deleteBtn.addEventListener('click', () => this.showDeleteConfirmation());
        }

        // Save new character button
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.saveCharacter());
        }

        // Delete confirmation buttons
        if (this.confirmDeleteBtn) {
            this.confirmDeleteBtn.addEventListener('click', () => this.deleteCharacter());
        }
        if (this.cancelDeleteBtn) {
            this.cancelDeleteBtn.addEventListener('click', () => this.hideDeleteConfirmation());
        }

        // Enter key in character name input
        if (this.nameInput) {
            this.nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveCharacter();
                }
            });
        }

        // Set up automatic character saving
        this.setupAutoSave();
    }

    setupAutoSave() {
        // Use event delegation to listen for all button clicks on the document
        document.addEventListener('click', (event) => {
            try {
                // Check if the clicked element is a button
                if (event.target.tagName === 'BUTTON') {
                    const buttonText = event.target.textContent.trim();
                    
                    // Check for "Save to [item name]" buttons or "Save Stat Equivalence Values" button
                    if (buttonText.startsWith('Save to ') || buttonText === 'Save Stat Equivalence Values') {
                        // Auto-update the current character if one is selected
                        this.autoUpdateCurrentCharacter(buttonText);
                    }
                }
            } catch (error) {
                console.warn('[WhackyBeanz Extension] Error in auto-save click handler:', error);
            }
        });
    }

    async autoUpdateCurrentCharacter(buttonText) {
        try {
            // Only auto-update if a character is currently selected
            if (!this.currentCharacterId) {
                return;
            }

            // Find the current character
            const characterIndex = this.characters.findIndex(c => c.id === this.currentCharacterId);
            if (characterIndex === -1) {
                console.warn('[WhackyBeanz Extension] Current character not found for auto-update');
                return;
            }

            // Get current page data
            const pageData = this.getCurrentPageData();
            
            // Update the character
            this.characters[characterIndex].data = pageData;
            this.characters[characterIndex].dateSaved = new Date().toISOString();
            
            // Save to storage
            await this.saveCharacters();
            
            // Update dropdown to reflect new save time
            this.populateDropdown();
            
            // Show a subtle notification
            const actionType = buttonText.startsWith('Save to ') ? 'equipment' : 'stat equivalence';
            this.showStatus(`Auto-saved ${actionType} data to "${this.characters[characterIndex].name}"`, 'success');
        } catch (error) {
            console.error('[WhackyBeanz Extension] Error in auto-update:', error);
            this.showStatus('Error auto-saving character data', 'error');
        }
    }

    onDropdownChange() {
        const selectedId = this.dropdown.value;
        const hasSelection = selectedId !== '';
        
        if (this.loadBtn) this.loadBtn.disabled = !hasSelection;
        if (this.updateBtn) this.updateBtn.disabled = !hasSelection;
        if (this.deleteBtn) this.deleteBtn.disabled = !hasSelection;
    }

    async loadCharacters() {
        try {
            // Check for possible character storage keys from old plugin
            const possibleKeys = [
                'whackybeanz-characters',
                'whackybeanz_characters', // fallback for underscore format
                'characters', 
                'savedCharacters',
                'characterData',
                'whackybeanz-current-character',
                'whackybeanz_current_character', // fallback for underscore format
                'currentCharacter',
                'lastLoadedChar'
            ];
            
            let result;
            try {
                result = await new Promise((resolve, reject) => {
                    chrome.storage.local.get(possibleKeys, (result) => {
                        if (chrome.runtime.lastError) {
                            console.error('[WhackyBeanz] Storage error:', chrome.runtime.lastError);
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(result);
                        }
                    });
                });
            } catch (chromeError) {
                console.warn('[WhackyBeanz] Chrome storage failed, trying browser storage:', chromeError);
                // Fallback to browser storage for better Vivaldi compatibility
                result = await browser.storage.local.get(possibleKeys);
            }
            
            // Try to find character data in any of the possible keys
            this.characters = result[this.STORAGE_KEY] || result['whackybeanz_characters'] || result['characters'] || result['savedCharacters'] || result['characterData'] || [];
            this.currentCharacterId = result[this.CURRENT_CHARACTER_KEY] || result['whackybeanz_current_character'] || result['currentCharacter'] || result['lastLoadedChar'] || null;
            
            // If we found characters in a different key, migrate them to our standard key
            if (this.characters.length > 0 && !result[this.STORAGE_KEY]) {
                await this.saveCharacters();
            }
            
            // If we found current character ID in a different key, migrate it too
            if (this.currentCharacterId && !result[this.CURRENT_CHARACTER_KEY] && (result['whackybeanz_current_character'] || result['lastLoadedChar'] || result['currentCharacter'])) {
                await this.saveCharacters();
            }
        } catch (error) {
            console.error('[WhackyBeanz] Error loading characters:', error);
            this.characters = [];
            this.currentCharacterId = null;
        }
    }

    async saveCharacters() {
        try {
            // Save to extension storage instead of localStorage
            const dataToSave = {
                [this.STORAGE_KEY]: this.characters
            };
            
            if (this.currentCharacterId) {
                dataToSave[this.CURRENT_CHARACTER_KEY] = this.currentCharacterId;
            }
            
            try {
                await new Promise((resolve, reject) => {
                    chrome.storage.local.set(dataToSave, () => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                });
            } catch (chromeError) {
                console.warn('[WhackyBeanz] Chrome storage save failed, trying browser storage:', chromeError);
                // Fallback to browser storage for better Vivaldi compatibility
                await browser.storage.local.set(dataToSave);
            }
            
            // Remove current character key if no character is selected
            if (!this.currentCharacterId) {
                try {
                    await new Promise((resolve, reject) => {
                        chrome.storage.local.remove(this.CURRENT_CHARACTER_KEY, () => {
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError);
                            } else {
                                resolve();
                            }
                        });
                    });
                } catch (chromeError) {
                    console.warn('[WhackyBeanz] Chrome storage remove failed, trying browser storage:', chromeError);
                    await browser.storage.local.remove(this.CURRENT_CHARACTER_KEY);
                }
            }
        } catch (error) {
            console.error('[WhackyBeanz] Error saving characters:', error);
            this.showStatus('Error saving characters to storage.', 'error');
        }
    }

    populateDropdown() {
        if (!this.dropdown) {
            console.error('[WhackyBeanz] populateDropdown: dropdown element not found!');
            return;
        }

        // Clear existing options except the first one
        this.dropdown.innerHTML = '<option value="">Select a character...</option>';

        if (this.characters.length === 0) {
            this.dropdown.disabled = true;
            this.onDropdownChange();
            return;
        }

        this.dropdown.disabled = false;

        // Sort characters by name
        const sortedCharacters = [...this.characters].sort((a, b) => a.name.localeCompare(b.name));

        sortedCharacters.forEach(character => {
            const option = document.createElement('option');
            option.value = character.id;
            
            const savedDate = new Date(character.dateSaved).toLocaleString([], {
                dateStyle: 'short',
                timeStyle: 'short'
            });
            
            option.textContent = `${character.name} (saved: ${savedDate})`;
            this.dropdown.appendChild(option);
        });

        // Select current character if exists
        if (this.currentCharacterId && this.characters.find(c => c.id === this.currentCharacterId)) {
            this.dropdown.value = this.currentCharacterId;
        }

        this.onDropdownChange();
    }

    getCurrentPageData() {
        // Capture all relevant localStorage data from the WhackyBeanz page
        const pageData = {};
        
        // Get all localStorage items
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            // Skip our own character management data
            if (!key.startsWith('whackybeanz_character')) {
                pageData[key] = localStorage.getItem(key);
            }
        }

        return pageData;
    }

    setPageData(data) {
        // Clear existing page data (but preserve character management data)
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key.startsWith('whackybeanz_character')) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Set the new data
        Object.entries(data || {}).forEach(([key, value]) => {
            localStorage.setItem(key, value);
        });
    }

    async saveCharacter() {
        if (!this.nameInput) return;
        
        const name = this.nameInput.value.trim();
        if (!name) {
            this.showStatus('Please enter a character name.', 'error');
            return;
        }

        // Check if name already exists
        if (this.characters.find(c => c.name.toLowerCase() === name.toLowerCase())) {
            this.showStatus('A character with this name already exists.', 'error');
            return;
        }

        const pageData = this.getCurrentPageData();
        
        const newCharacter = {
            id: this.generateId(),
            name: name,
            dateSaved: new Date().toISOString(),
            data: pageData
        };

        this.characters.push(newCharacter);
        this.currentCharacterId = newCharacter.id;
        
        // Also update lastLoadedChar for export/import compatibility
        await new Promise((resolve) => {
            chrome.storage.local.set({ 'lastLoadedChar': newCharacter.id }, () => {
                resolve();
            });
        });
        
        await this.saveCharacters();
        this.populateDropdown();
        
        this.nameInput.value = '';
        this.showStatus(`Character "${name}" saved successfully!`, 'success');
    }

    async loadCharacter() {
        const selectedId = this.dropdown.value;
        if (!selectedId) {
            this.showStatus('No character selected.', 'error');
            return;
        }

        const character = this.characters.find(c => c.id === selectedId);
        if (!character) {
            this.showStatus('Character not found.', 'error');
            return;
        }

        this.setPageData(character.data);
        this.currentCharacterId = selectedId;
        
        // Also update lastLoadedChar for export/import compatibility
        await new Promise((resolve) => {
            chrome.storage.local.set({ 'lastLoadedChar': selectedId }, () => {
                resolve();
            });
        });
        
        await this.saveCharacters();
        
        this.showStatus(`Character "${character.name}" loaded successfully!`, 'success');
        
        // Refresh the page to apply the loaded data
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    async updateCharacter() {
        const selectedId = this.dropdown.value;
        if (!selectedId) {
            this.showStatus('No character selected.', 'error');
            return;
        }

        const characterIndex = this.characters.findIndex(c => c.id === selectedId);
        if (characterIndex === -1) {
            this.showStatus('Character not found.', 'error');
            return;
        }

        const pageData = this.getCurrentPageData();
        
        this.characters[characterIndex].data = pageData;
        this.characters[characterIndex].dateSaved = new Date().toISOString();
        
        await this.saveCharacters();
        this.populateDropdown();
        
        this.showStatus(`Character "${this.characters[characterIndex].name}" updated successfully!`, 'success');
    }

    showDeleteConfirmation() {
        const selectedId = this.dropdown.value;
        if (!selectedId) {
            this.showStatus('No character selected.', 'error');
            return;
        }

        if (this.deleteBtn) this.deleteBtn.style.display = 'none';
        if (this.deleteConfirm) this.deleteConfirm.classList.remove('hidden');
    }

    hideDeleteConfirmation() {
        if (this.deleteBtn) this.deleteBtn.style.display = 'flex';
        if (this.deleteConfirm) this.deleteConfirm.classList.add('hidden');
    }

    async deleteCharacter() {
        const selectedId = this.dropdown.value;
        if (!selectedId) {
            this.showStatus('No character selected.', 'error');
            this.hideDeleteConfirmation();
            return;
        }

        const character = this.characters.find(c => c.id === selectedId);
        if (!character) {
            this.showStatus('Character not found.', 'error');
            this.hideDeleteConfirmation();
            return;
        }

        this.characters = this.characters.filter(c => c.id !== selectedId);
        
        if (this.currentCharacterId === selectedId) {
            this.currentCharacterId = null;
            
            // Also clear lastLoadedChar for export/import compatibility
            await new Promise((resolve) => {
                chrome.storage.local.remove('lastLoadedChar', () => {
                    resolve();
                });
            });
        }
        
        await this.saveCharacters();
        this.populateDropdown();
        this.hideDeleteConfirmation();
        
        this.showStatus(`Character "${character.name}" deleted successfully.`, 'success');
    }

    showStatus(message, type = 'info') {
        if (!this.statusMessage) return;
        
        this.statusMessage.textContent = message;
        this.statusMessage.className = `text-center text-sm font-medium ${this.getStatusClasses(type)}`;
        this.statusMessage.classList.remove('hidden');

        // Auto-hide after 4 seconds
        setTimeout(() => {
            this.statusMessage.classList.add('hidden');
        }, 4000);
    }

    getStatusClasses(type) {
        switch (type) {
            case 'success':
                return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3';
            case 'error':
                return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3';
            case 'info':
                return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3';
            default:
                return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-3';
        }
    }

    generateId() {
        return 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

/**
 * Initialize character management system
 */
function initCharacterManagement() {
    try {
        // Wait a bit for the DOM to settle
        setTimeout(() => {
            try {
                window.extensionCharacterManager = new ExtensionCharacterManager();
            } catch (error) {
                console.error('[WhackyBeanz Extension] Error creating character manager:', error);
            }
        }, 500);
    } catch (error) {
        console.error('[WhackyBeanz Extension] Error in initCharacterManagement:', error);
    }
}

/**
 * Plugin Settings Injection
 */
function injectPluginSettings() {
    // Find the Extras section (look for h2 with "Extras" text)
    const extrasCards = document.querySelectorAll('div.mb-12.border-2');
    let extrasSection = null;
    
    for (const card of extrasCards) {
        const h2 = card.querySelector('h2.text-lg.font-bold');
        if (h2 && h2.textContent.trim() === 'Extras') {
            extrasSection = card;
            break;
        }
    }

    if (!extrasSection) {
        // For setup/symbols page or other pages without Extras, append to main content area
        const isSymbolsPage = window.location.pathname.includes('/calc/symbols');
        let mainContentArea = null;
        
        if (isSymbolsPage) {
            // Use the same symbols page content detection as character management
            mainContentArea = document.querySelector('div.w-full.lg\\:w-9\\/12.relative.lg\\:pl-6') ||
                             document.querySelector('div.w-full.lg\\:w-9\\/12.relative') ||
                             document.querySelector('main') ||
                             document.querySelector('article');
        } else {
            // For flames and setup pages
            mainContentArea = document.querySelector('div.w-full.lg\\:w-9\\/12.relative.lg\\:pl-6.px-2');
        }
        
        // Fallback selectors
        if (!mainContentArea) {
            mainContentArea = document.querySelector('main') || 
                             document.querySelector('body');
        }
        
        if (!mainContentArea) {
            return;
        }
        
        // Check if plugin settings already exist
        if (document.getElementById('whackybeanz-plugin-settings')) {
            return;
        }
        
        const pluginSettingsHTML = `
            <div id="whackybeanz-plugin-settings" class="mb-12 border-2 border-slate-300 dark:border-zinc-700 rounded-lg py-2 px-4">
                <h2 class="text-lg font-bold">Plugin Settings</h2>
                <div class="sm:px-4 md:px-8">
                    <div class="py-4">
                        <div class="flex flex-col sm:flex-row gap-4">
                            <button 
                                id="whackybeanz-export-btn"
                                class="h-10 flex items-center justify-center border-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-blue-50 dark:hover:text-black dark:hover:bg-blue-400 rounded-lg transition-all duration-200 px-6 text-sm font-medium"
                            >
                                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" class="mr-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M288 109.3V352c0 17.7-14.3 32-32 32s-32-14.3-32-32V109.3l-73.4 73.4c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l128-128c12.5-12.5 32.8-12.5 45.3 0l128 128c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L288 109.3zM64 352H192c0 35.3 28.7 64 64 64s64-28.7 64-64H448c35.3 0 64 28.7 64 64v32c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V416c0-35.3 28.7-64 64-64z"></path>
                                </svg>
                                Export Data
                            </button>
                            
                            <div class="flex items-center gap-2">
                                <input 
                                    type="file" 
                                    id="whackybeanz-import-file" 
                                    accept=".json"
                                    class="hidden"
                                />
                                <button 
                                    id="whackybeanz-import-btn"
                                    class="h-10 flex items-center justify-center border-2 border-green-600 dark:border-green-400 bg-green-50 dark:bg-zinc-800 text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-green-50 dark:hover:text-black dark:hover:bg-green-400 rounded-lg transition-all duration-200 px-6 text-sm font-medium"
                                >
                                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" class="mr-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M288 182.7L224 246.7l0-230.7c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 230.7L96 182.7c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0zM64 352c0-35.3 28.7-64 64-64H320c35.3 0 64 28.7 64 64v32c0 35.3-28.7 64-64 64H128c-35.3 0-64-28.7-64-64V352z"></path>
                                    </svg>
                                    Import Data
                                </button>
                            </div>
                        </div>
                        
                        <!-- Status Messages -->
                        <div id="whackybeanz-export-success-msg" class="hidden mt-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 rounded-md text-sm">
                            Data exported successfully!
                        </div>
                        <div id="whackybeanz-import-success-msg" class="hidden mt-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 rounded-md text-sm">
                            Data imported successfully!
                        </div>
                        <div id="whackybeanz-import-error-msg" class="hidden mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-md text-sm">
                            Error importing data. Please check the file format.
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Append to main content area
        mainContentArea.insertAdjacentHTML('beforeend', pluginSettingsHTML);
        setupPluginSettingsEventListeners();
        return;
    }

    // Check if plugin settings already exist
    if (document.getElementById('whackybeanz-plugin-settings')) {
        return;
    }

    const pluginSettingsHTML = `
        <div id="whackybeanz-plugin-settings" class="mb-12 border-2 border-slate-300 dark:border-zinc-700 rounded-lg py-2 px-4">
            <h2 class="text-lg font-bold">Plugin Settings</h2>
            <div class="sm:px-4 md:px-8">
                <div class="py-4">
                    <div class="flex flex-col sm:flex-row gap-4">
                        <button 
                            id="whackybeanz-export-btn"
                            class="h-10 flex items-center justify-center border-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-blue-50 dark:hover:text-black dark:hover:bg-blue-400 rounded-lg transition-all duration-200 px-6 text-sm font-medium"
                        >
                            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" class="mr-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                <path d="M288 109.3V352c0 17.7-14.3 32-32 32s-32-14.3-32-32V109.3l-73.4 73.4c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l128-128c12.5-12.5 32.8-12.5 45.3 0l128 128c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L288 109.3zM64 352H192c0 35.3 28.7 64 64 64s64-28.7 64-64H448c35.3 0 64 28.7 64 64v32c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V416c0-35.3 28.7-64 64-64z"></path>
                            </svg>
                            Export Data
                        </button>
                        
                        <div class="flex items-center gap-2">
                            <input 
                                type="file" 
                                id="whackybeanz-import-file" 
                                accept=".json"
                                class="hidden"
                            />
                            <button 
                                id="whackybeanz-import-btn"
                                class="h-10 flex items-center justify-center border-2 border-green-600 dark:border-green-400 bg-green-50 dark:bg-zinc-800 text-green-600 dark:text-green-400 hover:bg-green-600 hover:text-green-50 dark:hover:text-black dark:hover:bg-green-400 rounded-lg transition-all duration-200 px-6 text-sm font-medium"
                            >
                                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" class="mr-2" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M288 182.7L224 246.7l0-230.7c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 230.7L96 182.7c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0zM64 352c0-35.3 28.7-64 64-64H320c35.3 0 64 28.7 64 64v32c0 35.3-28.7 64-64 64H128c-35.3 0-64-28.7-64-64V352z"></path>
                                </svg>
                                Import Data
                            </button>
                        </div>
                    </div>
                    
                    <!-- Status Messages -->
                    <div id="whackybeanz-export-success-msg" class="hidden mt-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 rounded-md text-sm">
                        Data exported successfully!
                    </div>
                    <div id="whackybeanz-import-success-msg" class="hidden mt-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 rounded-md text-sm">
                        Data imported successfully!
                    </div>
                    <div id="whackybeanz-import-error-msg" class="hidden mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-md text-sm">
                        Error importing data. Please check the file format.
                    </div>
                </div>
            </div>
        </div>
    `;

    // Insert before Extras section
    extrasSection.insertAdjacentHTML('beforebegin', pluginSettingsHTML);

    // Add event listeners
    setupPluginSettingsEventListeners();
}

/**
 * Plugin Settings Event Listeners
 */
function setupPluginSettingsEventListeners() {
    // Export functionality
    const exportBtn = document.getElementById('whackybeanz-export-btn');
    exportBtn?.addEventListener('click', async () => {
        try {
            // Get character data from chrome.storage.local
            const storageData = await new Promise((resolve) => {
                chrome.storage.local.get(['whackybeanz-characters'], (result) => {
                    resolve(result);
                });
            });

            // Get the current character from the character manager
            const currentCharId = window.extensionCharacterManager?.currentCharacterId || '';

            const data = {
                characters: storageData['whackybeanz-characters'] || [],
                expandFlames: localStorage.getItem('whackybeanz-expand-flames') === 'true',
                lastLoadedChar: currentCharId
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `whackybeanz-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Show success message
            const successMsg = document.getElementById('whackybeanz-export-success-msg');
            successMsg?.classList.remove('hidden');
            setTimeout(() => {
                successMsg?.classList.add('hidden');
            }, 4000);
        } catch (error) {
            console.error('Export error:', error);
        }
    });

    // Import functionality
    const importBtn = document.getElementById('whackybeanz-import-btn');
    const importFile = document.getElementById('whackybeanz-import-file');

    importBtn?.addEventListener('click', () => {
        importFile?.click();
    });

    importFile?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Import character data (support both old 'characters' and new 'characterManagement' formats)
                const charactersData = data.characters || data.characterManagement;
                if (charactersData && Array.isArray(charactersData)) {
                    // Save to chrome.storage.local
                    await new Promise((resolve) => {
                        chrome.storage.local.set({ 'whackybeanz-characters': charactersData }, () => {
                            resolve();
                        });
                    });
                    
                    // Reload character manager if it exists
                    if (window.extensionCharacterManager) {
                        // Force reload the characters from storage
                        await window.extensionCharacterManager.loadCharacters();
                        
                        // Repopulate the dropdown with new data
                        window.extensionCharacterManager.populateDropdown();
                        
                        // Set the last loaded character if specified
                        if (data.lastLoadedChar) {
                            const character = charactersData.find(char => char.id === data.lastLoadedChar);
                            if (character) {
                                // Use a timeout to ensure dropdown is fully populated
                                setTimeout(() => {
                                    const dropdown = document.getElementById('whackybeanz-character-dropdown');
                                    if (dropdown) {
                                        // Set the dropdown value
                                        dropdown.value = data.lastLoadedChar;
                                        
                                        // Set the current character ID in the manager
                                        window.extensionCharacterManager.currentCharacterId = data.lastLoadedChar;
                                        
                                        // Load the character data onto the page
                                        window.extensionCharacterManager.setPageData(character.data);
                                        
                                        // Save the current character selection
                                        window.extensionCharacterManager.saveCharacters();
                                        
                                        // Update the dropdown display
                                        window.extensionCharacterManager.onDropdownChange();
                                    }
                                }, 200);
                            }
                        } else if (charactersData.length > 0) {
                            // If no lastLoadedChar, load the first character
                            setTimeout(() => {
                                const dropdown = document.getElementById('whackybeanz-character-dropdown');
                                if (dropdown && dropdown.options.length > 1) {
                                    dropdown.selectedIndex = 1; // Skip "Select character" option
                                    const firstCharacter = charactersData[0];
                                    if (firstCharacter) {
                                        window.extensionCharacterManager.currentCharacterId = firstCharacter.id;
                                        window.extensionCharacterManager.setPageData(firstCharacter.data);
                                        window.extensionCharacterManager.saveCharacters();
                                    }
                                    window.extensionCharacterManager.onDropdownChange();
                                }
                            }, 200);
                        }
                    }
                }

                // Import expand flames table setting (support both old 'expandFlames' and new 'expandFlamesTable' formats)
                const expandSetting = data.expandFlames !== undefined ? data.expandFlames : data.expandFlamesTable;
                if (typeof expandSetting === 'boolean') {
                    localStorage.setItem('whackybeanz-expand-flames', expandSetting.toString());
                    const checkbox = document.getElementById('whackybeanz-expandFlamesCheck');
                    if (checkbox) {
                        checkbox.checked = expandSetting;
                        // Trigger change event to apply the setting
                        checkbox.dispatchEvent(new Event('change'));
                    }
                }

                // Show success message
                const successMsg = document.getElementById('whackybeanz-import-success-msg');
                successMsg?.classList.remove('hidden');
                setTimeout(() => {
                    successMsg?.classList.add('hidden');
                }, 4000);

            } catch (error) {
                console.error('Import error:', error);
                // Show error message
                const errorMsg = document.getElementById('whackybeanz-import-error-msg');
                errorMsg?.classList.remove('hidden');
                setTimeout(() => {
                    errorMsg?.classList.add('hidden');
                }, 4000);
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        e.target.value = '';
    });
}

/**
 * Initialize Expand Flames Table functionality
 */
function initExpandFlamesTable() {
    const checkbox = document.getElementById('whackybeanz-expandFlamesCheck');
    if (!checkbox) return;

    // Load saved state
    const savedState = localStorage.getItem('whackybeanz-expand-flames') === 'true';
    checkbox.checked = savedState;
    
    // Apply initial state
    if (savedState) {
        toggleFlamesHeight(true);
    }

    // Add event listener
    checkbox.addEventListener('change', (e) => {
        const isExpanded = e.target.checked;
        localStorage.setItem('whackybeanz-expand-flames', isExpanded.toString());
        toggleFlamesHeight(isExpanded);
    });
}
