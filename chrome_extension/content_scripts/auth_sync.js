// auth_sync.js
// Runs on http://localhost:8080/* to sync Auth Token to Extension

console.log('🔌 Auth Sync Script Loaded');

function syncToken() {
    // Supabase auth token key format: sb-[project-id]-auth-token
    const projectID = 'ojxzssooylmydystjvdo';
    const tokenKey = `sb-${projectID}-auth-token`;
    const storedData = localStorage.getItem(tokenKey);

    if (storedData) {
        try {
            const parsed = JSON.parse(storedData);
            const token = parsed.access_token;

            if (token) {
                console.log('🔑 Found Supabase Token, syncing to Extension...');
                chrome.runtime.sendMessage({ action: 'SYNC_TOKEN', token: token }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('⚠️ Extension not ready or not installed:', chrome.runtime.lastError.message);
                    } else {
                        console.log('✅ Extension Sync Response:', response);
                    }
                });
            }
        } catch (e) {
            console.error('Failed to parse Supabase token data:', e);
        }
    }
}

// Sync on load
syncToken();

// Sync on storage change
window.addEventListener('storage', (e) => {
    if (e.key.includes('auth-token')) {
        syncToken();
    }
});

// Bridge: Forward Dashboard Triggers to Extension
window.addEventListener('message', (event) => {
    // Only accept messages from ourselves
    if (event.source !== window) return;

    if (event.data.type === 'START_AUTO_ORDER' && event.data.task) {
        console.log('🤖 Bridge: Forwarding START_AUTO_ORDER to Background Worker');
        try {
            chrome.runtime.sendMessage({
                action: 'START_AUTO_ORDER',
                task: event.data.task
            }, (response) => {
                if (response && response.success) {
                    console.log('✅ Background script acknowledged task.');
                }
            });
        } catch (e) {
            console.error('Bridge failed:', e);
        }
    }
});
