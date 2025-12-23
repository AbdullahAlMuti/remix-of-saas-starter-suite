// auth_sync.js
// Runs on the web app domain to sync Auth Token to Extension
// Handles: Token sync, token refresh, session persistence

(function() {
    'use strict';
    
    const DEBUG = true;
    const PROJECT_ID = 'ojxzssooylmydystjvdo';
    const TOKEN_KEY = `sb-${PROJECT_ID}-auth-token`;
    
    function log(level, message, data = null) {
        if (!DEBUG && level === 'debug') return;
        const prefix = { debug: '🔍', info: 'ℹ️', success: '✅', warn: '⚠️', error: '❌' }[level] || '📝';
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        if (data) {
            console.log(`[${timestamp}] ${prefix} [AuthSync] ${message}`, data);
        } else {
            console.log(`[${timestamp}] ${prefix} [AuthSync] ${message}`);
        }
    }

    log('info', 'Auth Sync Script Loaded on ' + window.location.hostname);

    /**
     * Extract token from Supabase localStorage data
     */
    function extractTokenData() {
        try {
            const storedData = localStorage.getItem(TOKEN_KEY);
            if (!storedData) {
                log('debug', 'No token found in localStorage');
                return null;
            }
            
            const parsed = JSON.parse(storedData);
            
            // Check if token is expired
            const expiresAt = parsed.expires_at;
            if (expiresAt && Date.now() / 1000 > expiresAt) {
                log('warn', 'Token is expired', { expiresAt: new Date(expiresAt * 1000).toISOString() });
                // Don't return expired token - rely on refresh
                return null;
            }
            
            return {
                accessToken: parsed.access_token,
                refreshToken: parsed.refresh_token,
                expiresAt: parsed.expires_at,
                user: parsed.user
            };
        } catch (e) {
            log('error', 'Failed to parse token data', e);
            return null;
        }
    }

    /**
     * Send token to extension with proper error handling
     */
    function syncTokenToExtension(tokenData, retryCount = 0) {
        if (!tokenData || !tokenData.accessToken) {
            log('debug', 'No valid token to sync');
            return;
        }
        
        // Check if extension context is available
        if (!chrome?.runtime?.sendMessage) {
            log('warn', 'Chrome extension API not available');
            return;
        }
        
        log('info', 'Syncing token to extension...', { 
            userId: tokenData.user?.id, 
            email: tokenData.user?.email,
            expiresIn: tokenData.expiresAt ? Math.round(tokenData.expiresAt - Date.now()/1000) + 's' : 'unknown'
        });
        
        try {
            chrome.runtime.sendMessage(
                { 
                    action: 'SYNC_TOKEN', 
                    token: tokenData.accessToken,
                    user: tokenData.user,
                    expiresAt: tokenData.expiresAt
                }, 
                (response) => {
                    if (chrome.runtime.lastError) {
                        const errorMsg = chrome.runtime.lastError.message;
                        
                        // Handle specific errors
                        if (errorMsg.includes('Extension context invalidated') || 
                            errorMsg.includes('Could not establish connection')) {
                            log('warn', 'Extension not ready, will retry...', { error: errorMsg });
                            
                            // Retry with exponential backoff (max 3 retries)
                            if (retryCount < 3) {
                                const delay = Math.pow(2, retryCount) * 1000;
                                setTimeout(() => syncTokenToExtension(tokenData, retryCount + 1), delay);
                            }
                        } else {
                            log('error', 'Extension sync failed', { error: errorMsg });
                        }
                    } else if (response) {
                        if (response.success) {
                            log('success', 'Token synced to extension', { verified: response.verified });
                        } else {
                            log('warn', 'Extension reported sync issue', response);
                        }
                    }
                }
            );
        } catch (e) {
            log('error', 'Failed to send message to extension', e);
        }
    }

    /**
     * Handle logout - clear extension auth
     */
    function notifyLogout() {
        if (!chrome?.runtime?.sendMessage) return;
        
        try {
            chrome.runtime.sendMessage({ action: 'LOGOUT' }, (response) => {
                if (chrome.runtime.lastError) {
                    log('debug', 'Could not notify extension of logout');
                } else {
                    log('info', 'Extension notified of logout');
                }
            });
        } catch (e) {
            log('debug', 'Logout notification failed', e);
        }
    }

    /**
     * Initial sync on page load
     */
    function initialSync() {
        const tokenData = extractTokenData();
        if (tokenData) {
            // Small delay to ensure extension is ready
            setTimeout(() => syncTokenToExtension(tokenData), 500);
        }
    }

    /**
     * Watch for storage changes (login/logout/token refresh)
     */
    function watchStorageChanges() {
        window.addEventListener('storage', (e) => {
            // Only react to auth token changes
            if (!e.key || !e.key.includes('auth-token')) return;
            
            log('debug', 'Storage change detected', { key: e.key });
            
            if (e.newValue) {
                // Token added or updated
                const tokenData = extractTokenData();
                if (tokenData) {
                    syncTokenToExtension(tokenData);
                }
            } else if (!e.newValue && e.oldValue) {
                // Token removed (logout)
                log('info', 'Token removed, notifying extension');
                notifyLogout();
            }
        });
    }

    /**
     * Bridge: Forward Dashboard Triggers to Extension
     */
    function setupMessageBridge() {
        window.addEventListener('message', (event) => {
            // Only accept messages from ourselves
            if (event.source !== window) return;

            if (event.data.type === 'START_AUTO_ORDER' && event.data.task) {
                log('info', 'Bridge: Forwarding START_AUTO_ORDER to Background Worker');
                try {
                    chrome.runtime.sendMessage({
                        action: 'START_AUTO_ORDER',
                        task: event.data.task
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            log('error', 'Bridge message failed', chrome.runtime.lastError);
                        } else if (response?.success) {
                            log('success', 'Background script acknowledged task');
                        }
                    });
                } catch (e) {
                    log('error', 'Bridge failed', e);
                }
            }
            
            // Forward token refresh requests from web app
            if (event.data.type === 'REFRESH_EXTENSION_TOKEN') {
                const tokenData = extractTokenData();
                if (tokenData) {
                    syncTokenToExtension(tokenData);
                }
            }
        });
    }

    /**
     * Periodic token check - resync if token was refreshed
     */
    function startPeriodicSync() {
        let lastToken = null;
        
        setInterval(() => {
            const tokenData = extractTokenData();
            const currentToken = tokenData?.accessToken;
            
            // If token changed (refreshed), sync to extension
            if (currentToken && currentToken !== lastToken) {
                log('info', 'Token changed, re-syncing to extension');
                syncTokenToExtension(tokenData);
                lastToken = currentToken;
            }
        }, 60000); // Check every minute
    }

    // Initialize
    initialSync();
    watchStorageChanges();
    setupMessageBridge();
    startPeriodicSync();
    
})();
