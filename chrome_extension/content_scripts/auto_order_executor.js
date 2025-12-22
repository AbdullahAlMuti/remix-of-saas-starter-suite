// content_scripts/auto_order_executor.js

(function () {
    console.log("🤖 Amazon Smart Assist: Expert State Machine Active");

    const SELECTORS = {
        QUANTITY: 'select#quantity',
        BUY_NOW: 'input#buy-now-button',
        ADD_ADDRESS_LINK: 'a.a-link-normal.celwidget#add-new-address-desktop-sasp-tango-link',
        ADDRESS_FORM: {
            FULL_NAME: '#address-ui-widgets-enterAddressFullName',
            PHONE: '#address-ui-widgets-enterAddressPhoneNumber',
            ADDRESS1: '#address-ui-widgets-enterAddressLine1',
            CITY: '#address-ui-widgets-enterAddressCity',
            STATE: 'select#address-ui-widgets-enterAddressStateOrRegion-dropdown-nativeId',
            ZIP: '#address-ui-widgets-enterAddressPostalCode',
            SUBMIT: '#address-ui-widgets-form-submit-button input.a-button-input'
        },
        PLACE_ORDER: 'input#placeOrder'
    };

    const StatusOverlay = {
        element: null,
        init() {
            if (this.element) return;
            this.element = document.createElement('div');
            this.element.id = 'amazon-automation-overlay';
            this.element.style.cssText = `
                position: fixed; top: 15px; right: 15px; z-index: 2147483647;
                background: #1a1a1a; color: #fff; padding: 18px; width: 330px;
                border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
                font-size: 13px; border-left: 6px solid #febd69;
                pointer-events: none; transition: all 0.3s ease;
            `;
            this.element.innerHTML = `
                <div style="font-weight:700; margin-bottom:10px; color:#febd69; display:flex; justify-content:space-between; align-items:center;">
                    <span>AMAZON AUTOMATION</span>
                    <span id="auto-status-dot" style="height:10px; width:10px; background:#00c851; border-radius:50%; display:inline-block;"></span>
                </div>
                <div id="status-log" style="max-height:180px; overflow-y:auto; scrollbar-width: thin;"></div>
            `;
            document.body.appendChild(this.element);
        },
        log(msg, type = 'info') {
            this.init();
            const logEl = this.element.querySelector('#status-log');
            const entry = document.createElement('div');
            entry.style.marginTop = '6px';
            entry.style.paddingTop = '6px';
            entry.style.borderTop = '1px solid #333';

            let icon = 'ℹ️';
            if (type === 'success') { icon = '✅'; entry.style.color = '#00c851'; }
            if (type === 'error') { icon = '❌'; entry.style.color = '#ff4444'; }
            if (type === 'working') { icon = '⚙️'; }

            entry.innerHTML = `<span style="margin-right:8px;">${icon}</span>${msg}`;
            logEl.appendChild(entry);
            logEl.scrollTop = logEl.scrollHeight;
            console.log(`[Amazon Auto] ${msg}`);
        }
    };

    // --- State Machine ---
    const States = {
        IDLE: 'IDLE',
        INITIALIZING: 'INITIALIZING',
        HANDLING_PRODUCT: 'HANDLING_PRODUCT',
        WAITING_FOR_CHECKOUT_LOAD: 'WAITING_FOR_CHECKOUT_LOAD',
        TRIGGERING_ADD_ADDRESS: 'TRIGGERING_ADD_ADDRESS',
        FILLING_ADDRESS_FORM: 'FILLING_ADDRESS_FORM',
        REVIEW_ORDER: 'REVIEW_ORDER',
        COMPLETED: 'COMPLETED'
    };

    let checkInterval = null;

    async function runMachine() {
        const { activeAutoOrder, automationState } = await chrome.storage.local.get(['activeAutoOrder', 'automationState']);

        if (!activeAutoOrder) {
            StatusOverlay.log("Waiting for active order task...");
            return;
        }

        const currentState = automationState || States.INITIALIZING;

        switch (currentState) {
            case States.INITIALIZING:
                await handleInitialState();
                break;
            case States.HANDLING_PRODUCT:
                await handleProductPage(activeAutoOrder);
                break;
            case States.TRIGGERING_ADD_ADDRESS:
                await handleAddressSelection();
                break;
            case States.FILLING_ADDRESS_FORM:
                await handleFormFilling(activeAutoOrder);
                break;
            case States.REVIEW_ORDER:
                StatusOverlay.log("Final check: Click 'Place Order' manually when ready.", "success");
                clearInterval(checkInterval);
                break;
        }
    }

    async function updateState(newState) {
        await chrome.storage.local.set({ automationState: newState });
        console.log(`[State Transition] -> ${newState}`);
    }

    async function handleInitialState() {
        if (document.querySelector(SELECTORS.BUY_NOW)) {
            await updateState(States.HANDLING_PRODUCT);
        } else if (document.querySelector(SELECTORS.ADD_ADDRESS_LINK)) {
            await updateState(States.TRIGGERING_ADD_ADDRESS);
        } else if (document.querySelector(SELECTORS.ADDRESS_FORM.FULL_NAME)) {
            await updateState(States.FILLING_ADDRESS_FORM);
        }
    }

    async function handleProductPage(order) {
        const buyNow = document.querySelector(SELECTORS.BUY_NOW);
        if (!buyNow) return;

        StatusOverlay.log("Handling Product Page...");

        // Qty
        const qtySelect = document.querySelector(SELECTORS.QUANTITY);
        const targetQty = String(order.quantity || 1);
        if (qtySelect && qtySelect.value !== targetQty) {
            StatusOverlay.log(`Updating Qty to ${targetQty}...`);
            qtySelect.value = targetQty;
            qtySelect.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(r => setTimeout(r, 1000));
        }

        StatusOverlay.log("Clicking Buy Now...");
        buyNow.click();
        await updateState(States.WAITING_FOR_CHECKOUT_LOAD);
    }

    async function handleAddressSelection() {
        const addBtn = document.querySelector(SELECTORS.ADD_ADDRESS_LINK);
        if (!addBtn) {
            // Check if form is already there (maybe another script or user clicked)
            if (document.querySelector(SELECTORS.ADDRESS_FORM.FULL_NAME)) {
                await updateState(States.FILLING_ADDRESS_FORM);
            }
            return;
        }

        StatusOverlay.log("Clicking 'Add new address' exactly once...");
        await updateState(States.FILLING_ADDRESS_FORM); // Transition early to prevent loop
        addBtn.click();

        // Setup MutationObserver to detect the form apparition immediately
        observeModal();
    }

    function observeModal() {
        StatusOverlay.log("Watching for address modal...", "working");
        const observer = new MutationObserver((mutations, obs) => {
            const form = document.querySelector(SELECTORS.ADDRESS_FORM.FULL_NAME);
            if (form) {
                StatusOverlay.log("Modal detected! Initializing fill.");
                obs.disconnect();
                runMachine(); // Trigger logic immediately
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        // Timeout safeguard
        setTimeout(() => observer.disconnect(), 10000);
    }

    async function handleFormFilling(order) {
        const nameField = document.querySelector(SELECTORS.ADDRESS_FORM.FULL_NAME);
        if (!nameField) return;

        StatusOverlay.log("Transferring eBay customer info...");

        const setVal = (id, val) => {
            const el = document.querySelector(id);
            if (!el || !val) return;
            el.value = val;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        };

        // Strict 6-field transfer from order object
        setVal(SELECTORS.ADDRESS_FORM.FULL_NAME, order.shipping_name || order.buyer_name);
        setVal(SELECTORS.ADDRESS_FORM.PHONE, order.shipping_phone);
        setVal(SELECTORS.ADDRESS_FORM.ADDRESS1, order.shipping_line1);
        setVal(SELECTORS.ADDRESS_FORM.CITY, order.shipping_city);
        setVal(SELECTORS.ADDRESS_FORM.ZIP, order.shipping_zip);

        // State Dropdown
        if (order.shipping_state) {
            const stateEl = document.querySelector(SELECTORS.ADDRESS_FORM.STATE);
            if (stateEl) {
                const target = order.shipping_state.toUpperCase();
                const opt = Array.from(stateEl.options).find(o =>
                    o.value === target || o.text.toUpperCase().includes(target)
                );
                if (opt) {
                    stateEl.value = opt.value;
                    stateEl.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }

        await new Promise(r => setTimeout(r, 1000));

        const submit = document.querySelector(SELECTORS.ADDRESS_FORM.SUBMIT);
        if (submit) {
            StatusOverlay.log("Submitting address...");
            await updateState(States.REVIEW_ORDER);
            submit.click();
        }
    }

    // Start Polling Loop
    StatusOverlay.init();
    checkInterval = setInterval(runMachine, 2000);
    runMachine(); // Initial run

})();
