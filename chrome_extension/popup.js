// popup.js - Auto Redirector

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Check for Token in Extension Storage (Synced from Background)
        const data = await chrome.storage.local.get('saasToken');
        const token = data.saasToken;

        // 2. Decide Destination
        let url = "http://localhost:8080/auth"; // Default: Login

        if (token) {
            url = "http://localhost:8080/dashboard";
        }

        // 3. Open Tab
        chrome.tabs.create({ url: url }, () => {
            // 4. Close Popup (Clean exit)
            window.close();
        });

    } catch (e) {
        console.error("Redirect check failed:", e);
        // Fallback
        chrome.tabs.create({ url: "http://localhost:8080" });
    }
});