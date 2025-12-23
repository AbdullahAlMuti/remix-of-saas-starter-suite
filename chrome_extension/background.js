// ebay-snipping-extension/background.js

// Replicate API token - stored securely in chrome.storage.local
// Configurable via Admin Panel

const HOMEPAGE_URL = "http://localhost:8081/";

// Open homepage when extension is installed
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[SellerSuit] Extension installed, opening homepage');
    chrome.tabs.create({ url: HOMEPAGE_URL });
  }
});

// Default Google Sheet URL (fallback if not in storage)
const DEFAULT_SHEET_URL = "https://script.google.com/macros/s/AKfycbwU_ER6RWnY0koDjq7zs__LTdkMCF07nP8wvTe_05qZ5pcbDlpTu0VBlPZ3sI-sqIV5/exec";

// Helper function to get Google Sheet URL from storage with fallback
async function getGoogleSheetUrl() {
  try {
    // Check both storage keys (different parts of the codebase use different keys)
    const result = await chrome.storage.local.get(['googleSheetUrl', 'googleAppsScriptUrl']);

    // Prefer googleAppsScriptUrl (used by content scripts), fallback to googleSheetUrl
    const url = result.googleAppsScriptUrl || result.googleSheetUrl || DEFAULT_SHEET_URL;

    console.log('🔍 Storage lookup result:', {
      hasGoogleAppsScriptUrl: !!result.googleAppsScriptUrl,
      hasGoogleSheetUrl: !!result.googleSheetUrl,
      selectedUrl: url === DEFAULT_SHEET_URL ? 'DEFAULT' : url
    });

    return url;
  } catch (error) {
    console.warn('Failed to get Google Sheet URL from storage, using default:', error);
    return DEFAULT_SHEET_URL;
  }
}

// ═══════════════════════════════════════════════════════════
// 🔒 SECURITY GATEKEEPER (Enhanced with retry & better logging)
// ═══════════════════════════════════════════════════════════

let isExtensionUnlocked = false;
let lastAuthCheck = 0;
const AUTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Logging utility
function authLog(level, message, data = null) {
  const prefix = { debug: '🔍', info: 'ℹ️', success: '✅', warn: '⚠️', error: '❌' }[level] || '📝';
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  if (data) {
    console.log(`[${timestamp}] ${prefix} [Auth] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${prefix} [Auth] ${message}`);
  }
}

// Fetch with retry for auth requests
async function fetchWithRetry(url, options, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      
      lastError = new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastError = err;
      if (err.name === 'AbortError') {
        authLog('warn', `Request timeout (attempt ${attempt + 1})`);
      }
    }
    
    if (attempt < maxRetries) {
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Verify Auth with Backend (Enhanced)
async function verifyAuthStatus(forceRefresh = false) {
  // Skip if recently checked (unless forced)
  if (!forceRefresh && Date.now() - lastAuthCheck < AUTH_CHECK_INTERVAL && isExtensionUnlocked) {
    authLog('debug', 'Skipping auth check (recently verified)');
    return true;
  }
  
  try {
    const data = await chrome.storage.local.get(['saasToken', 'authTimestamp']);
    const token = data.saasToken;

    if (!token) {
      authLog('warn', 'LOCKDOWN: No saasToken found');
      isExtensionUnlocked = false;
      return false;
    }

    // Call Backend Authority with retry
    const response = await fetchWithRetry(
      'https://ojxzssooylmydystjvdo.supabase.co/functions/v1/auth-status',
      {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      },
      2,
      500
    );

    if (response.ok) {
      const result = await response.json();
      
      if (result.success && result.user) {
        authLog('success', 'Session verified', { userId: result.user.id, email: result.user.email });

        // SYNC: Update Extension Storage with fresh data
        await chrome.storage.local.set({
          userId: result.user.id,
          userPlan: result.user.plan,
          userCredits: result.user.credits,
          userEmail: result.user.email,
          authTimestamp: Date.now()
        });

        isExtensionUnlocked = true;
        lastAuthCheck = Date.now();
        return true;
      }
    }
    
    // Auth failed - check response details
    const errorData = await response.json().catch(() => ({}));
    authLog('warn', 'LOCKDOWN: Invalid session', { status: response.status, error: errorData.error });
    isExtensionUnlocked = false;
    return false;
    
  } catch (e) {
    authLog('error', 'Auth Check Error', { message: e.message });
    
    // If network error but we have recent valid auth, stay unlocked temporarily
    if (isExtensionUnlocked && Date.now() - lastAuthCheck < 30 * 60 * 1000) {
      authLog('info', 'Network error but using cached auth status');
      return true;
    }
    
    isExtensionUnlocked = false;
    return false;
  }
}

// Check on startup
// Check on startup
chrome.runtime.onStartup.addListener(() => {
  verifyAuthStatus();
  syncSettings();
});

chrome.runtime.onInstalled.addListener(() => {
  verifyAuthStatus();
  syncSettings();
});

// ═══════════════════════════════════════════════════════════
// 🔄 SETTINGS SYNC (Backend -> Extension)
// ═══════════════════════════════════════════════════════════
async function syncSettings() {
  try {
    const data = await chrome.storage.local.get('saasToken');
    const token = data.saasToken;
    if (!token) return;

    const saasUrl = 'https://ojxzssooylmydystjvdo.supabase.co';
    const saasKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qeHpzc29veWxteWR5c3RqdmRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMzY3NTgsImV4cCI6MjA4MTkxMjc1OH0.lQcFC2HryZamOEbGYONHpY37K0kTK4OOAa9MlluV7Dc';

    // Fetch Global Gemini API Key from Admin Settings
    const response = await fetch(`${saasUrl}/rest/v1/admin_settings?key=eq.gemini_api_key`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': saasKey
      }
    });

    if (response.ok) {
      const settingsData = await response.json();
      if (settingsData && settingsData.length > 0) {
        const apiKey = settingsData[0].value;
        if (apiKey) {
          await chrome.storage.local.set({ geminiApiKey: apiKey });
          console.log('🔄 SYNC: Gemini API Key updated from Admin Panel.');
        }
      }
    }
  } catch (error) {
    console.error('🔄 SYNC ERROR:', error);
  }
}

// Sync every 30 minutes
setInterval(syncSettings, 30 * 60 * 1000);

// ═══════════════════════════════════════════════════════════
// First Install Logic - Open Landing Page
// ═══════════════════════════════════════════════════════════
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // First time installation
    console.log('🎉 Extension installed for the first time!');
    await chrome.storage.local.set({ firstInstall: true });

    // Open Hosted Onboarding Page
    chrome.tabs.create({ url: "http://localhost:8080" });
  } else if (details.reason === 'update') {
    console.log('🔄 Extension updated to version', chrome.runtime.getManifest().version);
  }
});

// ═══════════════════════════════════════════════════════════
// 🤖 SMART ASSIST AUTO-ORDER POLLING
// ═══════════════════════════════════════════════════════════

let autoOrderInterval = null;

async function pollForAutoOrders() {
  // Auto-order polling disabled for local testing until auto-order function is ready
  return;
}

function startAutoOrderPolling() {
  if (autoOrderInterval) clearInterval(autoOrderInterval);
  // Poll every 5 minutes
  autoOrderInterval = setInterval(pollForAutoOrders, 5 * 60 * 1000);
  pollForAutoOrders();
}

// Check on startup
chrome.runtime.onStartup.addListener(() => {
  verifyAuthStatus().then(unlocked => {
    if (unlocked) startAutoOrderPolling();
  });
});

chrome.runtime.onInstalled.addListener(() => {
  verifyAuthStatus().then(unlocked => {
    if (unlocked) startAutoOrderPolling();
  });
});

// Date helper for YYYY-MM-DD format
function todayISO() {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Log product data to Google Sheet - exactly 6 columns only
async function logToSheetMinimal({ title, sku, ebayPrice, supplierPrice, supplierUrl }) {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('📤 STEP 3: logToSheetMinimal() CALLED');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Input parameters:', {
      title,
      sku,
      ebayPrice,
      supplierPrice,
      supplierUrl
    });
    console.log('═══════════════════════════════════════════════════════');

    // ═══════════════════════════════════════════════════════════
    // 📊 PREPARE DATA FOR GOOGLE SHEETS
    // ═══════════════════════════════════════════════════════════
    // Simple string conversion - same pattern as title/SKU
    const payload = {
      date: todayISO(),                    // "Date"
      title,                               // "Title" (direct pass-through)
      sku,                                 // "SKU" (direct pass-through)
      ebay_price: (ebayPrice !== undefined && ebayPrice !== null) ? String(ebayPrice) : '',      // "eBay Price" (simple string conversion)
      supplier_price: (supplierPrice !== undefined && supplierPrice !== null) ? String(supplierPrice) : '',  // "Supplier Price" (simple string conversion)
      supplier: (supplierUrl !== undefined && supplierUrl !== null) ? String(supplierUrl) : ''     // "Supplier" (URL, simple string conversion)
    };

    console.log('📋 Payload structure:');
    console.log('   📅 date:', payload.date, '(YYYY-MM-DD format)');
    console.log('   📝 title:', payload.title);
    console.log('   🏷️ sku:', payload.sku);
    console.log('   💰 ebay_price:', payload.ebay_price, '(type:', typeof payload.ebay_price, ', length:', payload.ebay_price.length, ')');
    console.log('   🛒 supplier_price:', payload.supplier_price, '(type:', typeof payload.supplier_price, ', length:', payload.supplier_price.length, ')');
    console.log('   🔗 supplier:', payload.supplier, '(type:', typeof payload.supplier, ', length:', payload.supplier.length, ')');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📦 Full JSON payload:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('═══════════════════════════════════════════════════════');

    // ═══════════════════════════════════════════════════════════
    // 🌐 GET AND VALIDATE GOOGLE SHEET URL
    // ═══════════════════════════════════════════════════════════
    console.log('🔍 Getting Google Sheet URL from storage...');
    const endpoint = await getGoogleSheetUrl();
    console.log('🌐 Retrieved URL:', endpoint);

    // Validate URL
    if (!endpoint || typeof endpoint !== 'string' || endpoint.trim() === '') {
      throw new Error('Invalid Google Sheet URL: URL is empty or not a string');
    }

    // Check if URL is a valid Google Apps Script URL
    const isValidUrl = endpoint.startsWith('https://script.google.com/macros/s/') && endpoint.includes('/exec');
    if (!isValidUrl) {
      console.warn('⚠️ WARNING: URL does not match expected Google Apps Script format');
      console.warn('Expected format: https://script.google.com/macros/s/.../exec');
      console.warn('Got:', endpoint);
    } else {
      console.log('✅ URL format validation passed');
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('📤 Sending POST request to Google Apps Script...');
    console.log('URL:', endpoint);
    console.log('Method: POST');
    console.log('Content-Type: application/json');
    console.log('═══════════════════════════════════════════════════════');

    // ═══════════════════════════════════════════════════════════
    // 📡 SEND FETCH REQUEST WITH TIMEOUT
    // ═══════════════════════════════════════════════════════════
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('═══════════════════════════════════════════════════════');
      console.log('📥 RESPONSE RECEIVED FROM GOOGLE APPS SCRIPT');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Status:', res.status, res.statusText);
      console.log('OK:', res.ok);
      console.log('═══════════════════════════════════════════════════════');

      if (!res.ok) {
        const errorText = await res.text();
        console.error('═══════════════════════════════════════════════════════');
        console.error('❌ GOOGLE SHEETS REQUEST FAILED');
        console.error('═══════════════════════════════════════════════════════');
        console.error('Status:', res.status, res.statusText);
        console.error('Response:', errorText);
        console.error('Payload sent:', JSON.stringify(payload, null, 2));
        console.error('═══════════════════════════════════════════════════════');
        throw new Error(`Google Sheets request failed: ${res.status} ${res.statusText} - ${errorText}`);
      } else {
        const responseText = await res.text();
        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ SUCCESSFULLY SENT TO GOOGLE SHEETS');
        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ Logged to sheet (6 columns only).');
        console.log('📊 Data sent:', JSON.stringify(payload, null, 2));
        console.log('📥 Response:', responseText);
        console.log('═══════════════════════════════════════════════════════');
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout: Google Apps Script did not respond within 30 seconds');
      }
      throw fetchError;
    }
  } catch (err) {
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ ERROR IN logToSheetMinimal()');
    console.error('═══════════════════════════════════════════════════════');
    console.error('Error type:', err.constructor.name);
    console.error('Error:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Input parameters:', { title, sku, ebayPrice, supplierPrice, supplierUrl });
    console.error('═══════════════════════════════════════════════════════');
    throw err; // Re-throw to allow caller to handle
  }
}

// Log product data to Google Sheet
async function logToSheet(data) {
  try {
    const endpoint = await getGoogleSheetUrl();
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    console.log("✅ Logged to sheet:", data);
  } catch (err) {
    console.error("❌ Sheet logging failed:", err);
  }
}

// Log product data to Google Sheet (legacy function for backward compatibility)
async function logProductToSheet({ sku, title, amazon_price, ebay_price, amazon_url }) {
  try {
    const endpoint = await getGoogleSheetUrl();
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku, title, amazon_price, ebay_price, amazon_url })
    });
    const result = await res.json();
    console.log("Sheet Log Result:", result);
  } catch (err) {
    console.error("Sheet Logging Failed:", err);
  }
}

// At the top of the file, add a helper
function safeSendResponse(sendResponse, data) {
  try {
    if (sendResponse && typeof sendResponse === 'function') {
      sendResponse(data);
      return true;
    }
  } catch (e) {
    console.error('Error sending response (port may be closed):', e);
  }
  return false;
}

// Helper to getting Replicate Token safely
async function getReplicateToken() {
  const result = await chrome.storage.local.get('replicateApiKey');
  return result.replicateApiKey;
}

// Listens for the message from the Amazon content script to start the eBay process.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // 1. BYPASS for Login Success (to unlock)
  if (request.action === 'LOGIN_SUCCESS') {
    console.log('🔓 LOGIN SUCCESS received. Unlocking...');
    verifyAuthStatus().then(success => {
      sendResponse({ success });
    });
    return true;
  }

  // 2. Token Sync from Web App (Enhanced)
  if (request.action === 'SYNC_TOKEN') {
    authLog('info', 'SYNC_TOKEN received from Web App', { 
      hasToken: !!request.token, 
      hasUser: !!request.user,
      expiresAt: request.expiresAt 
    });
    
    if (request.token) {
      (async () => {
        try {
          // Save token and user data
          const saveData = { 
            saasToken: request.token,
            authTimestamp: Date.now()
          };
          
          // If user data provided, save it too
          if (request.user) {
            saveData.saasUser = request.user;
            saveData.userId = request.user.id;
            saveData.userEmail = request.user.email;
          }
          
          await chrome.storage.local.set(saveData);
          authLog('success', 'Token saved to extension storage');
          
          // Verify with backend (force refresh)
          const verified = await verifyAuthStatus(true);
          
          sendResponse({ success: true, verified });
          
        } catch (err) {
          authLog('error', 'Failed to process SYNC_TOKEN', err);
          sendResponse({ success: false, error: err.message });
        }
      })();
      return true; // async response
    } else {
      sendResponse({ success: false, error: 'No token provided' });
    }
    return true;
  }
  
  // Handle logout from web app
  if (request.action === 'LOGOUT') {
    authLog('info', 'LOGOUT received from Web App');
    (async () => {
      try {
        await chrome.storage.local.remove([
          'saasToken', 'saasUser', 'userId', 'userEmail', 
          'userPlan', 'userCredits', 'authTimestamp'
        ]);
        isExtensionUnlocked = false;
        lastAuthCheck = 0;
        authLog('success', 'Auth data cleared');
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // 2. THE GATE: Block EVERYTHING else if locked (except allowed actions)
  if (!isExtensionUnlocked && request.action !== 'createAutoOrder') {
    console.warn(`⛔ BLOCKED action "${request.action}": Extension is LOCKED.`);

    // Try to verify once (maybe we missed an update)
    verifyAuthStatus().then(unlocked => {
      if (unlocked) {
        // Rerun logic? No, too complex. Just tell user to retry.
        sendResponse({ success: false, error: "Extension was locked. Please retry." });
      } else {
        // Open Login Page if user initiates action
        if (request.action !== 'AI_REMOVE_BG' && request.action !== 'GENERATE_TITLE' && request.action !== 'createAutoOrder') {
          // Only open for user-initiated clicks, not auto-churn
          chrome.tabs.create({ url: "http://localhost:8080/dashboard" });
        }
        sendResponse({ success: false, error: "Please Log In to use the extension." });
      }
    });
    return true;
  }

  if (request.action === 'CHECK_AUTH') {
    sendResponse({ success: true });
    return;
  }

  if (request.action === "AI_REMOVE_BG") {
    console.log('🖼️ Removing background for image:', request.imageUrl);

    (async () => {
      try {
        // Get Key from storage
        const result = await chrome.storage.local.get(['replicateApiKey']);
        const apiKey = result.replicateApiKey;

        if (!apiKey) {
          console.error('❌ Replicate API Key not found in storage!');
          sendResponse({ success: false, error: 'Replicate API Key is missing. Please set it in Admin options.' });
          return;
        }

        // Convert URL to Base64 (Server expects it)
        const imgResponse = await fetch(request.imageUrl);
        const blob = await imgResponse.blob();

        // Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async function () {
          const base64data = reader.result;

          try {
            // Call LOCAL BACKEND
            const API_ENDPOINT = "http://localhost:8080/v1/ai/remove-bg";

            console.log('🚀 Sending to SaaS Backend:', API_ENDPOINT);

            const response = await fetch(API_ENDPOINT, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": "demo-key" // Auth Stub
              },
              body: JSON.stringify({
                image_base64: base64data,
                replicate_api_token: apiKey // Sending key for now (Hybrid Transition)
              }),
            });

            const data = await response.json();

            if (data.output) {
              console.log('✅ Background removed:', data.output);
              // Send success message to UI
              chrome.runtime.sendMessage({
                action: "BG_REMOVED_SUCCESS",
                originalUrl: request.imageUrl,
                newUrl: data.output
              });
            } else {
              throw new Error(data.error || 'Unknown error from backend');
            }

          } catch (backendError) {
            console.error('❌ Backend Error:', backendError);
            chrome.runtime.sendMessage({
              action: "BG_REMOVED_ERROR",
              error: backendError.message
            });
          }
        };

      } catch (error) {
        console.error('❌ Setup Error:', error);
        chrome.runtime.sendMessage({
          action: "BG_REMOVED_ERROR",
          error: error.message
        });
      }
    })();
    return true; // Indicates asynchronous response
  } else if (request.action === "START_OPTILIST") {
    // CRITICAL: Return true immediately to indicate async response
    // CRITICAL: Send response early, don't wait for Google Sheets to complete
    (async () => {
      let responseSent = false;

      try {
        console.log('═══════════════════════════════════════════════════════');
        console.log('📥 STEP 2: BACKGROUND.JS RECEIVED START_OPTILIST MESSAGE');
        console.log('═══════════════════════════════════════════════════════');

        // Simple validation
        const hasTitle = request.title && typeof request.title === 'string' && request.title.trim() !== '';
        const hasSku = request.sku && typeof request.sku === 'string' && request.sku.trim() !== '';

        if (hasTitle && hasSku) {
          // Send success response immediately (don't wait for Google Sheets)
          sendResponse({ success: true, message: "Processing started" });
          responseSent = true;

          // Increment listed count
          try {
            const result = await chrome.storage.local.get('listedCount');
            const currentCount = result.listedCount || 0;
            await chrome.storage.local.set({ listedCount: currentCount + 1 });
            console.log(`✅ Listed count incremented to: ${currentCount + 1}`);
          } catch (countError) {
            console.error('❌ Failed to increment listed count:', countError);
          }

          // Then handle SaaS Logging async with retry
          authLog('info', 'Syncing listing to SaaS Backend...');
          
          (async function syncWithRetry() {
            const MAX_RETRIES = 3;
            let lastError = null;
            
            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
              try {
                // Fetch token
                const tokenData = await chrome.storage.local.get('saasToken');
                const token = tokenData.saasToken;

                if (!token) {
                  authLog('warn', 'No auth token for sync-listing, queueing for later');
                  // Queue for later sync
                  await chrome.storage.local.get('pendingSyncQueue').then(data => {
                    const queue = data.pendingSyncQueue || [];
                    queue.push({
                      type: 'listing',
                      data: {
                        title: request.title,
                        sku: request.sku,
                        ebay_price: request.finalPrice,
                        amazon_price: request.amazonPrice,
                        amazon_url: request.productURL,
                        amazon_asin: request.asin,
                        status: "active"
                      },
                      queuedAt: Date.now()
                    });
                    return chrome.storage.local.set({ pendingSyncQueue: queue });
                  });
                  return;
                }

                const logResponse = await fetchWithRetry(
                  'https://ojxzssooylmydystjvdo.supabase.co/functions/v1/sync-listing',
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      title: request.title,
                      sku: request.sku,
                      ebay_price: request.finalPrice,
                      amazon_price: request.amazonPrice,
                      amazon_url: request.productURL,
                      amazon_asin: request.asin,
                      status: "active"
                    })
                  },
                  2, // retries for this fetch
                  1000
                );

                if (!logResponse.ok) {
                  const errorData = await logResponse.json().catch(() => ({}));
                  throw new Error(errorData.error || `HTTP ${logResponse.status}`);
                }

                const logResult = await logResponse.json();
                authLog('success', 'Listing synced to SaaS', logResult.summary || logResult);
                return; // Success, exit retry loop

              } catch (err) {
                lastError = err;
                authLog('warn', `Sync attempt ${attempt + 1}/${MAX_RETRIES} failed`, { error: err.message });
                
                if (attempt < MAX_RETRIES - 1) {
                  await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
              }
            }
            
            // All retries failed - queue for later
            authLog('error', 'All sync attempts failed, queueing for later', { error: lastError?.message });
            try {
              const data = await chrome.storage.local.get('pendingSyncQueue');
              const queue = data.pendingSyncQueue || [];
              queue.push({
                type: 'listing',
                data: {
                  title: request.title,
                  sku: request.sku,
                  ebay_price: request.finalPrice,
                  amazon_price: request.amazonPrice,
                  amazon_url: request.productURL,
                  amazon_asin: request.asin,
                  status: "active"
                },
                queuedAt: Date.now(),
                lastError: lastError?.message
              });
              await chrome.storage.local.set({ pendingSyncQueue: queue });
              authLog('info', 'Listing queued for retry', { queueSize: queue.length });
            } catch (queueError) {
              authLog('error', 'Failed to queue listing', queueError);
            }
          })();
        } else {
          sendResponse({ success: false, error: "Missing required data (title or SKU)" });
          responseSent = true;
          return;
        }

        // Continue with eBay tab opening (don't wait for this)
        const storageData = {
          ebayTitle: request.title,
          ebayCondition: request.condition || "1000"
        };

        chrome.storage.local.set(storageData, () => {
          chrome.tabs.create({ url: "https://www.ebay.com/sl/prelist/suggest?sr=shListingsTopNav" }, (tab) => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
              if (tabId === tab.id && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);

                setTimeout(() => {
                  chrome.tabs.sendMessage(tab.id, { action: "RUN_EBAY_LISTER" }, (response) => {
                    if (chrome.runtime.lastError) {
                      console.error("Error sending RUN_EBAY_LISTER:", chrome.runtime.lastError);
                    } else {
                      console.log("✅ RUN_EBAY_LISTER sent successfully");
                    }
                  });
                }, 2000);
              }
            });
          });
        });
      } catch (error) {
        console.error('❌ ERROR IN START_OPTILIST HANDLER:', error);
        // Only send response if it hasn't been sent yet
        if (!responseSent) {
          try {
            sendResponse({ success: false, error: error.message || "Unknown error occurred" });
          } catch (e) {
            // Response already sent or port closed, just log
            console.error('Could not send error response:', e);
          }
        }
      }
    })();

    return true; // Indicates an asynchronous response - MUST return true immediately
  } else if (request.action === "logSheet") {
    logToSheet(request.payload);
    return true;
  } else if (request.action === "LOG_TO_SHEET") {
    logProductToSheet(request.payload);
    sendResponse({ success: true });
    return true;
  } else if (request.action === "SAVE_TO_SHEET") {
    const { title, sku, ebayPrice, amazonPrice, amazonUrl } = request.payload;

    const date = new Date().toLocaleDateString("en-US");
    const row = [date, title || "", sku || "", ebayPrice || "", amazonPrice || "", "", "", "", "", "", "", amazonUrl || ""];

    getGoogleSheetUrl().then(endpoint => {
      fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ row })
      })
        .then(() => console.log("✅ Logged to Google Sheet"))
        .catch(err => console.error("❌ Sheet logging failed:", err));
    }).catch(err => console.error("❌ Failed to get endpoint:", err));
    return true;
  } else if (request.action === 'openNewTabForDescription') {
    chrome.storage.local.set({ tempAmazonURL: request.amazonURL }, () => {
      chrome.tabs.create({ url: request.targetURL, active: false }, (tab) => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            setTimeout(() => {
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content_scripts/description_paster.js"]
              }).catch((error) => {
                console.error("Error injecting description script:", error);
              });
            }, 2000);
          }
        });
      });
    });
    return true;
  } else if (request.action === 'openNewTabForProductDetails') {
    // Store the title temporarily so the new script can access it
    chrome.storage.local.set({ tempAmazonTitle: request.amazonTitle }, () => {
      // Create the new tab in the background (active: false)
      chrome.tabs.create({ url: request.targetURL, active: false }, (tab) => {
        // Wait for the tab to finish loading before injecting the script
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            // Inject the new paster script into the fully loaded tab
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["content_scripts/description_paster.js"]
            });
          }
        });
      });
    });
    return true; // Indicates an asynchronous response
  } else if (request.action === "GENERATE_TITLE") {
    (async () => {
      try {
        const { productData } = request;

        // Try to get fresh key if missing
        let results = await chrome.storage.local.get(['saasToken', 'geminiApiKey', 'adminSettings']);
        let apiKey = results.geminiApiKey;

        if (!apiKey) {
          console.log("🔍 Gemini key missing in storage, syncing now...");
          await syncSettings();
          results = await chrome.storage.local.get(['geminiApiKey']);
          apiKey = results.geminiApiKey;
        }

        const token = results.saasToken;
        const settings = results.adminSettings || {};

        if (!token) throw new Error("Please log in to the SaaS dashboard.");
        if (!apiKey) throw new Error("Missing Gemini API Key. Please configure it in the Admin Panel.");

        // Priority 1: Use specific prompt from settings if available
        // Priority 2: Use a default optimized prompt
        const defaultPrompt = `Generate a high-converting, SEO-optimized eBay product title (max 80 chars) for this Amazon product. 
Original Title: {{title}}
Keywords: {{keywords}}
Rules: No mentions of Amazon, no brand names unless essential, highlight key features. 
Output ONLY the refined title.`;

        const promptTemplate = settings.ai_title_prompt || defaultPrompt;

        const title = await generateTitleWithGemini(apiKey, promptTemplate, {
          title: productData?.title,
          keywords: productData?.keywords
        });

        console.log("✅ SaaS AI Title Generated:", title);
        sendResponse({ success: true, title: title });

      } catch (error) {
        console.error("❌ SaaS AI Failed:", error);
        sendResponse({ success: false, error: error.message || "Unknown error" });
      }
    })();
    return true;
  } else if (request.action === "START_AUTO_ORDER") {
    // Open Amazon URL and trigger executor
    const { task } = request;
    if (!task || !task.amazon_url) {
      sendResponse({ success: false, error: "Invalid task data" });
      return;
    }

    chrome.storage.local.set({
      activeAutoOrder: task,
      automationStep: 'AMAZON_CHECKOUT'
    }, () => {
      chrome.tabs.create({ url: task.amazon_url }, (tab) => {
        // Wait for tab to load
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            // Give it 1s
            setTimeout(() => {
              chrome.tabs.sendMessage(tab.id, { action: "RUN_AUTO_ORDER_SEQUENCE" });
            }, 1000);
          }
        });
      });
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === "AUTO_ORDER_LOG") {
    const { orderId, logAction, details } = request;
    (async () => {
      try {
        const tokenData = await chrome.storage.local.get('saasToken');
        const token = tokenData.saasToken;
        if (!token) return;

        const saasUrl = 'https://ojxzssooylmydystjvdo.supabase.co';
        const saasKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qeHpzc29veWxteWR5c3RqdmRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMzY3NTgsImV4cCI6MjA4MTkxMjc1OH0.lQcFC2HryZamOEbGYONHpY37K0kTK4OOAa9MlluV7Dc';

        // Use Supabase REST API to update status
        // We match by ebay_order_id
        await fetch(`${saasUrl}/rest/v1/auto_orders?ebay_order_id=eq.${orderId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': saasKey,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ status: logAction, details })
        });
      } catch (err) {
        console.error("Logging to Supabase failed:", err);
      }
    })();
    return true;
  } else if (request.action === "createAutoOrder") {
    (async () => {
      try {
        console.log("🚀 Background Proxy: Creating Auto-Order...", request.data);
        const tokenData = await chrome.storage.local.get('saasToken');
        const token = tokenData.saasToken;

        if (!token) throw new Error("No SaaS Token found. Please log in.");

        // Map extension data to Supabase schema
        const payload = {
          ebay_order_id: request.data.order_id,
          ebay_sku: request.data.sku,
          buyer_name: request.data.buyer_name,
          buyer_address: request.data.shipping_address,
          item_price: parseFloat(String(request.data.details.price || '0').replace(/[^0-9.]/g, '')),
          details: request.data.details,
          status: 'PENDING'
        };

        const saasUrl = 'https://ojxzssooylmydystjvdo.supabase.co';
        const saasKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qeHpzc29veWxteWR5c3RqdmRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMzY3NTgsImV4cCI6MjA4MTkxMjc1OH0.lQcFC2HryZamOEbGYONHpY37K0kTK4OOAa9MlluV7Dc';

        const response = await fetch(`${saasUrl}/rest/v1/auto_orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': saasKey,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(`Supabase Error: ${errData.message || response.statusText}`);
        }

        const result = await response.json();
        const createdOrder = result[0];
        console.log("✅ Auto-Order Created:", createdOrder);
        sendResponse({ success: true, id: createdOrder.id });

      } catch (error) {
        console.error("❌ Auto-Order Failed:", error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  } else {
    sendResponse({ success: false, error: "Unknown action" });
  }
});

// Helper to generate title using Gemini API
async function generateTitleWithGemini(apiKey, promptTemplate, productData, modelName = "gemini-1.5-flash") {
  if (!apiKey) throw new Error("Missing Gemini API Key");

  // Create a copy of the template
  let constructedPrompt = promptTemplate;

  // 1. Handle regular fields (strings)
  for (const [key, value] of Object.entries(productData)) {
    if (typeof value === 'string' || typeof value === 'number') {
      // Create a regex that matches {{key}} case-insensitively
      // escape special regex chars in key just in case (though keys are simple here)
      const regex = new RegExp(`{{${key}}}`, 'gi');
      constructedPrompt = constructedPrompt.replace(regex, String(value));
    }
  }

  // 2. Handle special fields like keywords (array)
  if (productData.keywords && Array.isArray(productData.keywords)) {
    const keywordsStr = productData.keywords.join(", ");
    constructedPrompt = constructedPrompt.replace(/{{keywords}}/gi, keywordsStr);
  }

  console.log('🧠 Final AI Prompt:', constructedPrompt);

  // Basic fallback if no replacement happened (e.g. empty template or no matching keys)
  // Check if it still looks like a template (has {{...}}) or is empty
  if (!constructedPrompt.trim() || (constructedPrompt === promptTemplate && promptTemplate.includes('{{'))) {
    console.warn('⚠️ Prompt construction might have failed or template was unchanged.');
    // Only force fallback if it's completely empty
    if (!constructedPrompt.trim()) {
      constructedPrompt = `Generate a catchy SEO title for: ${productData.title}`;
    }
  }

  const targetModel = modelName || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{
      parts: [{
        text: constructedPrompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 60
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `API Error: ${response.status}`);
  }

  const data = await response.json();
  if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
    return data.candidates[0].content.parts[0].text.trim().replace(/^"|"$/g, ''); // Remove quotes if any
  } else {
    throw new Error("No candidates returned from Gemini");
  }
}