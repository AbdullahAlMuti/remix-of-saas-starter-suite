// content_scripts/ebay_order_scraper.js

(function () {
    console.log("eBay Order Scraper Active");

    const VALID_SELECTORS = {
        // Multi-strategy selectors
        ORDER_ID: [
            '.order-info-value',                  // Standard Detail View
            'span[data-test-id="order-id"]',      // Newer React View
            'div.order-info div:nth-child(1)',    // Fallback Layout
            'span.sh-secondary',                  // Legacy
            '.page-header__title'                 // General Headers
        ],
        ORDER_DATE: 'dd.info-value',
        PRICE: 'dl.total span.sh-bold',
        QUANTITY: 'div.quantity span strong',
        SHIPPING_BLOCK: [
            '.shipping-address',                  // Visible Address Block
            '.address-info',
            'div[class*="address"]',
            '.buyer-info',
            '.ship-to-container',
            '.shipping-info .content .details'
        ],
        SHIPPING_ICON: 'svg.icon--shipping',
        PRODUCT_TITLE: 'a.fake-link.fake-btn.fake-btn--borderless'
    };

    // --- Visual Overlay Helper ---
    const StatusOverlay = {
        element: null,
        init() {
            if (this.element) return;
            this.element = document.createElement('div');
            this.element.id = 'automation-status-overlay';
            this.element.style.cssText = `
                position: fixed; top: 10px; right: 10px; z-index: 2147483647;
                background: #222; color: #fff; padding: 15px; width: 330px;
                border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                font-family: monospace; font-size: 13px; line-height: 1.4;
                border-left: 5px solid #0070ba; pointer-events: none; opacity: 0.95;
            `;
            this.element.innerHTML = `<div style="font-weight:bold; margin-bottom:8px; color:#0070ba; border-bottom:1px solid #444; padding-bottom:5px;">eBay Automation (Debug)</div><div id="status-log" style="max-height:250px; overflow-y:auto;">Initializing...</div>`;
            document.body.appendChild(this.element);
        },
        log(message) {
            console.log(`[eBay Auto] ${message}`);
            this.init();
            const logEl = this.element.querySelector('#status-log');
            logEl.innerHTML += `<div style="margin-top:4px; border-top:1px solid #333; padding-top:4px;">✓ ${message}</div>`;
            logEl.scrollTop = logEl.scrollHeight;
        },
        error(message) {
            console.error(`[eBay Auto] ${message}`);
            this.init();
            this.element.style.borderLeftColor = '#ff4444';
            const logEl = this.element.querySelector('#status-log');
            logEl.innerHTML += `<div style="margin-top:4px; color:#ff6666; font-weight:bold;">✗ ${message}</div>`;
            logEl.scrollTop = logEl.scrollHeight;
        },
        info(message) {
            console.log(`[eBay Auto] ${message}`);
            this.init();
            const logEl = this.element.querySelector('#status-log');
            logEl.innerHTML += `<div style="margin-top:4px; color:#aaa;">ℹ ${message}</div>`;
            logEl.scrollTop = logEl.scrollHeight;
        },
        final(message) {
            this.log(message);
            this.element.style.borderLeftColor = '#00cc66'; // Green
        }
    };

    // Router
    if (window.location.href.includes('ebay.com/sh/ord') && !window.location.href.includes('details')) {
        initOrdersList();
    } else if (window.location.href.includes('ebay.com/mesh/ord/details') || window.location.href.includes('view-order')) {
        initDetailPage(); // Run immediately on detail page
    }

    function initOrdersList() {
        StatusOverlay.log("Ready. Injecting 'Auto Order' buttons...");
        setInterval(injectButtons, 2000);

        document.body.addEventListener('click', function (e) {
            if (e.target.classList.contains('auto-order-btn')) {
                e.preventDefault();
                e.stopPropagation();

                const btn = e.target;
                const row = btn.closest('tr') || btn.closest('.table-row') || btn.closest('div[id^="order-"]');

                if (row) {
                    const orderLink = row.querySelector('a[href*="mesh/ord/details"]') ||
                        row.querySelector('a[href*="ebay.com/ulk/itm/"]') ||
                        row.querySelector('a[href*="view-order"]');

                    if (orderLink) {
                        StatusOverlay.info(`Opening Details...`);
                        window.open(orderLink.href, '_blank');
                    } else {
                        StatusOverlay.error("No 'Order Details' link found. Open manually.");
                    }
                } else {
                    StatusOverlay.error("Could not find row.");
                }
            }
        });
    }

    function injectButtons() {
        console.log('[eBay Auto] Scanning for rows...');

        // Strategy A: ID-based rows (Standard)
        const rows = document.querySelectorAll('tr[id^="order-"], div[id^="order-"]');

        // Strategy B: Action Column Finder (Robust)
        const actionAnchors = Array.from(document.querySelectorAll('a, button, div[role="button"]')).filter(el => {
            const text = el.innerText.toLowerCase();
            return text.includes('print shipping label') ||
                text.includes('purchase shipping label') ||
                text.includes('view order details') ||
                text.includes('shipped');
        });

        // Strategy C: Order Number Anchor (Fallback)
        // Find "Order no." or matching pattern, then traverse up to find the row
        const orderNumAnchors = Array.from(document.querySelectorAll('*')).filter(el => {
            // Only leaf nodes
            if (el.children.length > 0) return false;
            return /Order\s*(?:no|#)[:\s]+\d{2}-\d{5}-\d{5}/i.test(el.innerText) ||
                /^\d{2}-\d{5}-\d{5}$/.test(el.innerText);
        });

        const containers = new Set();

        // A. Add ID-based containers
        rows.forEach(row => {
            // Priority: Actions column -> Last cell -> First cell (bad fallback)
            const container = row.querySelector('.col-actions') ||
                row.querySelector('.actions-cell') ||
                row.querySelector('td:last-child');
            if (container) {
                containers.add(container);
            } else {
                // Try to force inject into the last DIV if row is a DIV
                if (row.tagName === 'DIV' && row.children.length > 0) {
                    containers.add(row.lastElementChild);
                }
            }
        });

        // B. Add Action-Anchor-based containers
        actionAnchors.forEach(anchor => {
            let parent = anchor.parentElement;
            for (let i = 0; i < 5; i++) {
                if (!parent) break;
                // Heuristic: Actions column usually smallish
                if ((parent.classList.contains('col-actions') || parent.offsetWidth < 300) && parent.children.length > 0) {
                    containers.add(parent);
                    break;
                }
                parent = parent.parentElement;
            }
        });

        // C. Add Order-Number-based containers (Find row, then find action col)
        orderNumAnchors.forEach(anchor => {
            let row = anchor.closest('tr') || anchor.closest('div[class*="order"]');
            if (row) {
                const container = row.querySelector('.col-actions') ||
                    row.querySelector('.actions-cell') ||
                    row.querySelector('td:last-child');
                if (container) containers.add(container);
            }
        });

        console.log(`[eBay Debug] Found ${containers.size} targets. A:${rows.length}, B:${actionAnchors.length}, C:${orderNumAnchors.length}`);

        // Inject
        containers.forEach(container => {
            if (container.querySelector('.auto-order-btn')) return;

            // Validations
            if (container.offsetWidth < 20 || container.offsetHeight < 20) return;
            const style = window.getComputedStyle(container);
            if (style.display === 'none' || style.visibility === 'hidden') return;

            const btn = document.createElement('button');
            btn.className = 'auto-order-btn';
            btn.innerHTML = '⚡ Auto Order';
            btn.style.cssText = `
                background-color: #7c3aed; color: white; border: none; 
                padding: 6px 4px; border-radius: 4px; font-weight: bold; 
                cursor: pointer; font-size: 11px; margin-top: 5px; 
                display: inline-block; width: 90%; text-align: center;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2); z-index: 999;
            `;

            // Highlight container for debug
            // container.style.border = "1px solid red"; 

            container.appendChild(btn);
        });
    }

    // --- MAIN SCRAPING LOGIC ---

    async function initDetailPage() {
        StatusOverlay.init();
        StatusOverlay.log("Initializing scraper...");

        // Debug Delay (Visual)
        StatusOverlay.info("Waiting 3s for DOM to stabilize...");
        await waitFor(3000);

        try {
            StatusOverlay.log("Attempting to scrape...");
            const orderData = await scrapeOrderData();

            // Visual Validation
            if (!orderData.ebay_order_id) StatusOverlay.error("❌ Failed to scrape Order ID");
            else StatusOverlay.log(`✓ Order ID: ${orderData.ebay_order_id}`);

            if (!orderData.shipping || !orderData.shipping.fullName) StatusOverlay.error("❌ Failed to scrape Address");
            else {
                StatusOverlay.log(`✓ COPIED Shipping for Amazon: ${orderData.shipping.fullName}`);
                StatusOverlay.info(`✓ Address: ${orderData.shipping.city || '?'}, ${orderData.shipping.state || '?'}`);
            }

            StatusOverlay.log(`✓ SKU: ${orderData.product_title ? orderData.product_title.substring(0, 15) : 'N/A'}`);

            if (orderData.ebay_order_id && orderData.shipping && orderData.shipping.fullName) {
                // Send to SaaS
                StatusOverlay.info("📡 Connecting to Backend...");
                const saasId = await sendToSaaS(orderData);

                if (saasId) {
                    StatusOverlay.final("✓ SAVED! Redirecting in 2s...");
                    orderData.saas_id = saasId;
                    await waitFor(2000);

                    // Proceed
                    await chrome.storage.local.set({
                        'activeAutoOrder': orderData,
                        'automationStep': 'DAILY_FINDZ_SEARCH'
                    });

                    if (orderData.product_title) {
                        const searchUrl = `https://www.dailyfindz.com/search?q=${encodeURIComponent(orderData.product_title)}`;
                        window.location.href = searchUrl;
                    }
                } else {
                    StatusOverlay.error("⚠️ DATA NOT SAVED. Check Terminal/Network.");
                }
            } else {
                StatusOverlay.error("❌ MISSING CRITICAL DATA. Aborting.");
            }

        } catch (e) {
            StatusOverlay.error(`Main Error: ${e.message}`);
            console.error(e);
        }
    }

    async function scrapeOrderData() {
        // Helper to find value by label (dt -> dd)
        const findValueByLabel = (labelPattern) => {
            const labels = Array.from(document.querySelectorAll('dt, span, div.label, div.info-label'));
            for (let label of labels) {
                if (label.innerText.trim().match(labelPattern)) {
                    let next = label.nextElementSibling;
                    if (!next && label.parentElement.tagName === 'DT') {
                        next = label.parentElement.nextElementSibling;
                    }
                    if (next) return next.innerText.trim();
                }
            }
            return '';
        };

        // 1. Find Order ID
        let orderId = findValueByLabel(/^Order/i);
        // Clean it (remove "Order number" prefix if grabbed by fallback)
        if (orderId) {
            const match = orderId.match(/\d{2}-\d{5}-\d{5}/);
            if (match) orderId = match[0];
        }

        // Fallback strategies for Order ID
        if (!orderId) {
            // Strategy B: CSS Selectors (Fallback)
            for (let sel of VALID_SELECTORS.ORDER_ID) {
                const els = document.querySelectorAll(sel);
                for (let el of els) {
                    const text = el.innerText.trim();
                    if (/^\d{2}-\d{5}-\d{5}$/.test(text)) {
                        orderId = text;
                        break;
                    }
                }
                if (orderId) break;
            }
        }

        if (!orderId) {
            // Strategy C: Body Text Regex (Last Resort)
            const allText = document.body.innerText;
            const match = allText.match(/Order number[:\s#]+(\d{2}-\d{5}-\d{5})/i) ||
                allText.match(/(\d{2}-\d{5}-\d{5})/); // Just find the pattern anywhere
            if (match) orderId = match[1];
        }

        // 2. Find Date (Sold Date)
        let dateVal = findValueByLabel(/^Sold/i);
        if (!dateVal) {
            const dateEl = document.querySelector(VALID_SELECTORS.ORDER_DATE);
            if (dateEl) dateVal = dateEl.innerText.trim();
        }

        // 3. Find Phone Number (Direct Selector - User Provided)
        let phoneNumber = '';
        try {
            const phoneBtn = document.querySelector('dl.phone button.tooltip__host[type="button"]');
            if (phoneBtn) {
                phoneNumber = phoneBtn.innerText.trim();
                StatusOverlay.info(`✓ Phone: ${phoneNumber}`);
            }
        } catch (e) {
            console.log("Phone extraction error:", e);
        }

        // 4. Find Address - NEW SELECTOR-BASED METHOD (User Provided)
        let shipping = {};
        try {
            StatusOverlay.info("Extracting shipping details via CSS selectors...");

            // Helper function to safely get text from selector
            const getText = (selector) => {
                const el = document.querySelector(selector);
                return el ? el.innerText.trim() : '';
            };

            // Extract each field using precise selectors (Strict Refined Style)
            const name = getText('.shipping-address .address > div:nth-child(1) button');
            const street = getText('.shipping-address .address > div:nth-child(2) button');
            const city = getText('.shipping-address .address > div:nth-child(3) button');
            const state = getText('.shipping-address .address > div:nth-child(3) span.copy-to-clipboard:nth-of-type(2) button');
            const zip = getText('.shipping-address .address > div:nth-child(3) span.copy-to-clipboard:nth-of-type(3) button');
            const phone = getText('dl.phone button.tooltip__host');

            // Build shipping object
            shipping = {
                fullName: name || '',
                line1: street || '',
                line2: '',
                city: city || '',
                state: state || '',
                zipCode: zip || '',
                phone: phone || ''
            };


            // Log extracted data for debugging
            if (shipping.fullName) {
                StatusOverlay.log(`✓ Name: ${shipping.fullName}`);
                StatusOverlay.info(`✓ Address: ${shipping.line1}, ${shipping.city}, ${shipping.state} ${shipping.zipCode}`);
                if (shipping.phone) StatusOverlay.info(`✓ Phone: ${shipping.phone}`);
            } else {
                StatusOverlay.error("❌ Selector-based extraction failed. Falling back to text parsing...");

                // FALLBACK: Use old text-parsing method if selectors don't work
                const copyBtn = document.querySelector('button[aria-label="Copy address to clipboard."]') ||
                    document.querySelector('button[aria-label*="Copy address"]');

                if (copyBtn) {
                    const container = copyBtn.closest('.shipping-address') ||
                        copyBtn.closest('.address-info') ||
                        copyBtn.parentElement;

                    if (container) {
                        const cleanText = container.innerText.replace("Copy address to clipboard.", "").trim();
                        shipping = parseAddressText(cleanText);
                    }
                } else {
                    // Try visible address blocks
                    for (let sel of VALID_SELECTORS.SHIPPING_BLOCK) {
                        const el = document.querySelector(sel);
                        if (el && el.innerText.length > 10 && el.innerText.match(/\d+/)) {
                            shipping = parseAddressText(el.innerText);
                            break;
                        }
                    }
                }
            }
        } catch (e) {
            StatusOverlay.error(`Address error: ${e.message}`);
            console.error(e);
        }

        // 4. Product Title
        const productTitle = scrapeProductTitle();

        // 5. Scrape Price (Prioritize "Order earnings")
        let priceVal = '$0.00';

        // Strategy A: "Order earnings" Label Search (dt -> dd)
        // User Selector logic: dl.total dt button:contains("Order earnings") + dd.amount
        const labels = Array.from(document.querySelectorAll('dt, dt button, div.label'));
        for (let label of labels) {
            if (label.innerText.includes("Order earnings") || label.innerText.includes("Total") || label.innerText.includes("Order total")) {
                // Try to find the associated value container
                // 1. Check parent DT's next sibling DD
                let dt = label.closest('dt');
                let target = null;

                if (dt && dt.nextElementSibling && dt.nextElementSibling.tagName === 'DD') {
                    target = dt.nextElementSibling;
                }
                // 2. Check direct sibling (if label is div)
                else if (label.tagName === 'DIV' && label.nextElementSibling) {
                    target = label.nextElementSibling;
                }

                if (target) {
                    // Check for .amount or .sh-bold inside
                    const amountEl = target.querySelector('.amount') || target.querySelector('.sh-bold') || target;
                    if (amountEl && amountEl.innerText.includes('$')) {
                        priceVal = amountEl.innerText.trim();
                        StatusOverlay.info(`Found Price via '${label.innerText}': ${priceVal}`);
                        break;
                    }
                }
            }
        }

        // Strategy B: Fallback selector
        if (priceVal === '$0.00' || !priceVal.includes('$')) {
            const priceEl = document.querySelector(VALID_SELECTORS.PRICE);
            if (priceEl) priceVal = priceEl.innerText.trim();
        }

        return {
            date: dateVal || new Date().toLocaleDateString(),
            ebay_order_id: orderId,
            ebay_price: priceVal,
            quantity: 1, // Default to 1
            shipping: shipping,
            product_title: productTitle
        };
    }

    function parseAddressText(text) {
        // More robust heuristic parser
        console.log("Parsing Address Text:", text);
        let lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.includes('Ship to'));

        // Remove button label and headers if present
        lines = lines.filter(l =>
            l !== "Copy address to clipboard." &&
            !l.includes('Ship Details') &&
            !l.includes('Shipping Details') &&
            !l.includes('Buyer info')
        );

        if (lines.length < 2) return { fullName: text.substring(0, 10) };

        const name = lines[0].replace('Buyer:', '').trim();
        let city = '', state = '', zip = '';

        // 1. Find the ZIP line
        const zipOnlyPattern = /\b\d{5}(?:-\d{4})?\b/;
        let zipIdx = lines.findIndex(l => zipOnlyPattern.test(l));

        if (zipIdx !== -1) {
            const line = lines[zipIdx];
            zip = (line.match(zipOnlyPattern) || [])[0] || '';

            // Try standard pattern: "City, ST Zip"
            const standardPattern = /^(.*),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?).*$/i;
            const match = line.match(standardPattern);

            if (match) {
                city = match[1].trim();
                state = match[2].trim().toUpperCase();
            } else {
                // Not standard. Is the city/state on the line ABOVE?
                const lineWithoutZip = line.replace(zip, '').trim();
                if (lineWithoutZip.length < 3 && zipIdx > 0) {
                    const prevLine = lines[zipIdx - 1];
                    // Does prev line look like "City, ST"?
                    const prevMatch = prevLine.match(/^(.*),\s*([A-Z]{2})$/i) || prevLine.match(/^(.*)\s+([A-Z]{2})$/i);
                    if (prevMatch) {
                        city = prevMatch[1].trim();
                        state = prevMatch[2].trim().toUpperCase();
                    } else {
                        // Just split the prev line
                        const parts = prevLine.split(/\s+/);
                        if (parts.length > 1) {
                            state = parts.pop().toUpperCase();
                            city = parts.join(' ');
                        } else {
                            city = prevLine;
                        }
                    }
                } else if (lineWithoutZip.length >= 3) {
                    // Try to parse the zip line itself
                    const parts = lineWithoutZip.split(/[\s,]+/);
                    if (parts.length > 1) {
                        state = parts.pop().toUpperCase();
                        city = parts.join(' ');
                    } else {
                        city = lineWithoutZip;
                    }
                }
            }
        }

        // Clean up common issues
        city = city.replace(/,$/, '').trim();
        if (state.length !== 2) state = '';

        // 2. Find phone number (proper phone format, not zip codes)
        // Match: (123) 456-7890, 123-456-7890, 1234567890, +1-123-456-7890
        const phonePattern = /(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/;
        let phone = '';
        for (let line of lines) {
            // Skip lines that are just zip codes
            if (zipOnlyPattern.test(line) && !phonePattern.test(line)) continue;
            const match = line.match(phonePattern);
            if (match) {
                phone = line.trim();
                break;
            }
        }

        return {
            fullName: name,
            line1: lines[1] || '',
            line2: (lines.length > 3 && zipIdx > 2 && lines[2] !== city) ? lines[2] : '',
            city: city,
            state: state,
            zipCode: zip,
            country: 'US',
            phone: phone
        };
    }

    async function getShippingDetails() {
        StatusOverlay.info("Looking for Shipping Icon (Fallback)...");
        const shipIcon = document.querySelector(VALID_SELECTORS.SHIPPING_ICON);
        if (!shipIcon) return {};

        StatusOverlay.info("Opening shipping dialog...");
        const clickTarget = shipIcon.closest('button') || shipIcon.closest('a') || shipIcon;
        clickTarget.click();

        await waitFor(1500);

        const dialogs = document.querySelectorAll('.dialog__window, .overlay-content, [role="dialog"]');
        let dialog = null;
        for (let d of dialogs) {
            if (d.offsetParent !== null) { dialog = d; break; }
        }

        if (dialog) return parseAddressText(dialog.innerText);
        return {};
    }

    function scrapeProductTitle() {
        // Try multiple headers/links
        const titleEl = document.querySelector(VALID_SELECTORS.PRODUCT_TITLE) ||
            document.querySelector('.item-title') ||
            document.querySelector('a[data-test-id="item-title"]');

        let title = titleEl ? titleEl.innerText.trim() : "";
        if (!title && document.title) {
            title = document.title.split('|')[0].trim(); // Fallback to page title
        }

        // Cleanup common Amazon trash words
        return title.replace(/NEW|SEALED|BNIB|Boxed|L@@K/gi, '').trim();
    }

    // --- UTILS ---

    function waitFor(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function sendToSaaS(data) {
        try {
            StatusOverlay.info("Sending to Background Proxy...");

            // Delegate to Background Script (Bypasses Mixed Content Block)
            const response = await chrome.runtime.sendMessage({
                action: 'createAutoOrder',
                data: {
                    order_id: data.ebay_order_id,
                    sku: data.product_title,
                    buyer_name: data.shipping.fullName,
                    shipping_address: {
                        line1: data.shipping.line1,
                        line2: data.shipping.line2,
                        city: data.shipping.city,
                        state: data.shipping.state,
                        zip: data.shipping.zipCode,
                        country: data.shipping.country || 'US',
                        phone: data.shipping.phone
                    },
                    details: {
                        price: data.ebay_price,
                        quantity: data.quantity,
                        date: data.date,
                        image: ''
                    }
                }
            });

            if (response && response.success) {
                StatusOverlay.log("Proxy Success: " + response.id);
                return response.id;
            } else {
                const errorMsg = response ? response.error : 'Unknown';
                StatusOverlay.error(`Proxy Error: ${errorMsg}`);

                if (errorMsg && errorMsg.includes("No SaaS Token")) {
                    StatusOverlay.info("ℹ️ Opening Dashboard to re-sync...");
                }
                return null;
            }
        } catch (error) {
            console.error('SaaS Proxy Error:', error);
            StatusOverlay.error("Extension Connection Error.");
            return null;
        }
    }

})();
