// content_scripts/dailyfindz_automator.js

(function () {
    console.log("DailyFindz Automator Active");

    // --- Visual Overlay Helper ---
    const StatusOverlay = {
        element: null,
        init() {
            if (this.element) return;
            this.element = document.createElement('div');
            this.element.id = 'dailyfindz-status-overlay';
            this.element.style.cssText = `
                position: fixed; top: 10px; right: 10px; z-index: 2147483647;
                background: #222; color: #fff; padding: 15px; width: 300px;
                border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                font-family: monospace; font-size: 13px; line-height: 1.4;
                border-left: 5px solid #28a745; pointer-events: none; opacity: 0.95;
            `;
            this.element.innerHTML = `<div style="font-weight:bold; margin-bottom:8px; color:#28a745; border-bottom:1px solid #444; padding-bottom:5px;">DailyFindz Auto</div><div id="status-log" style="max-height:200px; overflow-y:auto;">Initializing...</div>`;
            document.body.appendChild(this.element);
        },
        log(message) {
            console.log(`[DailyFindz Auto] ${message}`);
            this.init();
            const logEl = this.element.querySelector('#status-log');
            logEl.innerHTML += `<div style="margin-top:4px; border-top:1px solid #333; padding-top:4px;">✓ ${message}</div>`;
            logEl.scrollTop = logEl.scrollHeight;
        },
        error(message) {
            console.error(`[DailyFindz Auto] ${message}`);
            this.init();
            this.element.style.borderLeftColor = '#ff4444';
            const logEl = this.element.querySelector('#status-log');
            logEl.innerHTML += `<div style="margin-top:4px; color:#ff6666; font-weight:bold;">✗ ${message}</div>`;
            logEl.scrollTop = logEl.scrollHeight;
        },
        info(message) {
            console.log(`[DailyFindz Auto] ${message}`);
            this.init();
            const logEl = this.element.querySelector('#status-log');
            logEl.innerHTML += `<div style="margin-top:4px; color:#aaa;">ℹ ${message}</div>`;
            logEl.scrollTop = logEl.scrollHeight;
        }
    };

    // Check if we are in an active automation flow
    chrome.storage.local.get(['activeAutoOrder', 'automationStep'], (result) => {
        if (!result.activeAutoOrder) return;

        StatusOverlay.log("Automation Sequence Active.");
        console.log("Automation Mode: ", result.automationStep);

        if (window.location.href.includes('/search')) {
            handleSearchPage();
        } else {
            // Assume product page if not search
            handleProductPage();
        }
    });

    async function handleSearchPage() {
        StatusOverlay.log("Processing Search Results...");

        await waitFor(2000);

        // Find first link that isn't a nav link
        const firstProduct = document.querySelector('a[href*="/products/"], a[href*="/item/"]');

        if (firstProduct) {
            StatusOverlay.log(`Found product: ${firstProduct.href.substring(0, 30)}...`);
            chrome.storage.local.set({ 'automationStep': 'DAILY_FINDZ_PRODUCT' });

            // Highlight for visual
            firstProduct.style.border = "3px solid #28a745";
            await waitFor(500);

            firstProduct.click();
        } else {
            StatusOverlay.error("No product links found on page.");
            console.warn("No products found.");
        }
    }

    async function handleProductPage() {
        StatusOverlay.log("Processing Product Page...");

        await waitFor(2000);

        // Find Amazon link
        const amazonLink = document.querySelector('a[href*="amazon.com"]');

        if (amazonLink) {
            StatusOverlay.log(`Found Amazon Link: ${amazonLink.href.substring(0, 30)}...`);

            // Set step to AMAZON_CHECKOUT
            chrome.storage.local.set({ 'automationStep': 'AMAZON_CHECKOUT' });

            amazonLink.style.border = "3px solid #febd69"; // Amazon color
            await waitFor(1000);

            window.open(amazonLink.href, '_blank');
        } else {
            StatusOverlay.error("Amazon link not found.");
            console.warn("Amazon link not found.");
        }
    }

    function waitFor(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

})();
