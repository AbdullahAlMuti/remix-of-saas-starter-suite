
// ═══════════════════════════════════════════════════════════
// SaaS Integration (Added via Phase 2)
// ═══════════════════════════════════════════════════════════

function setupSaaSIntegrationListeners() {
    const saasLoginBtn = document.getElementById('saas-login-btn');
    const saasStatusContainer = document.getElementById('saas-status-container');

    // 1. Check for Auth Code in URL (Callback from Login)
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');

    if (authCode) {
        console.log('🔐 Auth Code received:', authCode);
        handleAuthExchange(authCode, saasStatusContainer);
    }

    // 2. Load current Status
    checkSaaSStatus(saasStatusContainer);

    // 3. Login Button Click
    if (saasLoginBtn) {
        saasLoginBtn.addEventListener('click', () => {
            const extensionId = chrome.runtime.id;
            // Use localhost for MVP
            const authUrl = `http://localhost:3000/auth/extension-login?extension_id=${extensionId}`;
            window.open(authUrl, '_blank');
        });
    }
}

async function handleAuthExchange(code, container) {
    try {
        if (container) container.innerHTML = '<p>Connecting...</p>';

        const response = await fetch('http://localhost:3000/v1/auth/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });

        const data = await response.json();

        if (data.access_token) {
            await chrome.storage.local.set({
                saasToken: data.access_token,
                saasUser: data.user
            });
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);

            checkSaaSStatus(container);
            alert('Successfully connected to SellerSuit SaaS!');
        } else {
            throw new Error(data.error || 'Auth failed');
        }
    } catch (error) {
        console.error('Auth Error:', error);
        if (container) container.innerHTML = `<p style="color:red">Connection failed: ${error.message}</p>`;
    }
}

async function checkSaaSStatus(container) {
    if (!container) container = document.getElementById('saas-status-container');
    if (!container) return;

    const result = await chrome.storage.local.get(['saasUser']);
    if (result.saasUser) {
        container.innerHTML = `
            <p class="status-text" style="color: green">Connected as ${result.saasUser.email}</p>
            <div style="margin-top: 8px;">
                <span style="background:#2563EB;color:white;padding:2px 6px;border-radius:4px;font-size:10px;">${result.saasUser.plan.toUpperCase()}</span>
                <button id="saas-logout-btn" style="margin-left: 10px; font-size: 12px; background:none; border:none; color:red; cursor:pointer; text-decoration:underline;">Disconnect</button>
            </div>
        `;

        document.getElementById('saas-logout-btn')?.addEventListener('click', async () => {
            await chrome.storage.local.remove(['saasToken', 'saasUser']);
            checkSaaSStatus(container);
        });
    } else {
        container.innerHTML = `
            <p class="status-text">Not Connected</p>
            <button id="saas-login-btn-retry" class="secondary-btn" style="background:#2563EB;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">Connect Account</button>
        `;
        document.getElementById('saas-login-btn-retry')?.addEventListener('click', () => {
            const extensionId = chrome.runtime.id;
            const authUrl = `http://localhost:3000/auth/extension-login?extension_id=${extensionId}`;
            window.open(authUrl, '_blank');
        });
    }
}
