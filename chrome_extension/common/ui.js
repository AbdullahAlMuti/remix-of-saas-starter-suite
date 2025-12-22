// ═══════════════════════════════════════════════════════════
// UI Helper Module - Shared UI Utilities
// ═══════════════════════════════════════════════════════════

const UIHelper = (() => {
  /**
   * Show toast notification
   * @param {string} message - Message to display
   * @param {string} type - Type: 'success', 'error', 'info', 'warning'
   * @param {number} duration - Duration in ms (default 3000)
   */
  function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    
    // Create container if it doesn't exist
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️'
    };
    
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
    `;
    
    // Add styles
    toast.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      border-radius: 8px;
      background: ${getToastColor(type)};
      color: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 14px;
      font-weight: 500;
      opacity: 0;
      transform: translateX(100px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto-dismiss
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }
  
  function getToastColor(type) {
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      info: '#17a2b8',
      warning: '#ffc107'
    };
    return colors[type] || colors.info;
  }

  /**
   * Show loading overlay
   * @param {string} message - Loading message
   */
  function showLoading(message = 'Processing...') {
    let overlay = document.getElementById('global-loading-overlay');
    
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'global-loading-overlay';
      overlay.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
          <div class="spinner"></div>
          <div class="loading-text" style="color: white; font-size: 16px; font-weight: 500;">${message}</div>
        </div>
      `;
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483646;
      `;
      document.body.appendChild(overlay);
      
      // Add spinner styles
      const style = document.createElement('style');
      style.textContent = `
        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(255,255,255,0.1);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    } else {
      overlay.querySelector('.loading-text').textContent = message;
      overlay.style.display = 'flex';
    }
  }

  /**
   * Hide loading overlay
   */
  function hideLoading() {
    const overlay = document.getElementById('global-loading-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  /**
   * Show confirmation dialog
   * @param {string} message - Confirmation message
   * @param {string} confirmText - Confirm button text
   * @param {string} cancelText - Cancel button text
   * @returns {Promise<boolean>} True if confirmed
   */
  function confirm(message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'confirm-modal';
      modal.innerHTML = `
        <div class="confirm-backdrop"></div>
        <div class="confirm-dialog">
          <div class="confirm-message">${message}</div>
          <div class="confirm-actions">
            <button class="btn-cancel">${cancelText}</button>
            <button class="btn-confirm">${confirmText}</button>
          </div>
        </div>
      `;
      
      modal.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 2147483645;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      const style = document.createElement('style');
      style.textContent = `
        .confirm-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
        }
        .confirm-dialog {
          position: relative;
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .confirm-message {
          font-size: 16px;
          color: #1a1a1a;
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .confirm-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        .confirm-actions button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cancel {
          background: #e2e8f0;
          color: #64748b;
        }
        .btn-cancel:hover {
          background: #cbd5e1;
        }
        .btn-confirm {
          background: #1a73e8;
          color: white;
        }
        .btn-confirm:hover {
          background: #1557b0;
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(modal);
      
      modal.querySelector('.btn-cancel').addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(false);
      });
      
      modal.querySelector('.btn-confirm').addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(true);
      });
      
      modal.querySelector('.confirm-backdrop').addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(false);
      });
    });
  }

  /**
   * Create and download a file
   * @param {string} content - File content
   * @param {string} filename - Filename
   * @param {string} mimeType - MIME type
   */
  function downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!', 'success');
      return true;
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      showToast('Failed to copy', 'error');
      return false;
    }
  }

  /**
   * Format date to readable string
   * @param {Date|string|number} date - Date to format
   * @returns {string} Formatted date
   */
  function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Debounce function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in ms
   * @returns {Function} Debounced function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Public API
  return {
    showToast,
    showLoading,
    hideLoading,
    confirm,
    downloadFile,
    copyToClipboard,
    formatDate,
    debounce
  };
})();

// Make it available globally or as a module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIHelper;
}
