/**
 * Utility Functions for Invoice System
 * Common helpers used across the application
 */

// ============== AUTHENTICATION ==============

/**
 * Check if user is authenticated
 * Redirects to login page if not authenticated
 */
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        window.location.href = 'index.html';
        return false;
    }

    return true;
}

/**
 * Logout user
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// ============== THEME ==============

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update toggle button icon
    const toggleBtn = document.querySelector('.theme-toggle');
    if (toggleBtn) {
        toggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }
}

/**
 * Load saved theme from localStorage
 */
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Update toggle button icon
    const toggleBtn = document.querySelector('.theme-toggle');
    if (toggleBtn) {
        toggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
}

// ============== FORMATTING ==============

/**
 * Format number as Indian Rupee currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '₹0.00';
    }

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format date to readable format
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
    if (!dateStr) return '-';

    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check for today
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    }

    // Check for tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    }

    // Format as DD MMM YYYY
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Format payment method to display name
 * @param {string} method - Payment method code
 * @returns {string} Formatted method name
 */
function formatPaymentMethod(method) {
    const methods = {
        upi: '💳 UPI',
        bank_transfer: '🏦 Bank Transfer',
        cash: '💵 Cash',
        cheque: '📝 Cheque',
        other: '📌 Other',
    };

    return methods[method] || method;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Get status badge HTML
 * @param {string} status - Invoice status
 * @returns {string} Badge HTML
 */
function getStatusBadge(status) {
    const badges = {
        paid: '<span class="badge badge-success">✓ Paid</span>',
        unpaid: '<span class="badge badge-danger">⏳ Unpaid</span>',
        partial: '<span class="badge badge-warning">◐ Partial</span>',
    };

    return badges[status] || `<span class="badge badge-secondary">${status}</span>`;
}

// ============== UI HELPERS ==============

/**
 * Show alert message
 * @param {string} containerId - Container element ID
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success, error, warning, info)
 */
function showAlert(containerId, message, type = 'info') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const alertClass = {
        success: 'alert-success',
        error: 'alert-error',
        warning: 'alert-warning',
        info: 'alert-info',
    }[type] || 'alert-info';

    const icon = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
    }[type] || 'ℹ';

    container.innerHTML = `
        <div class="alert ${alertClass}">
            <span>${icon}</span>
            <span>${escapeHtml(message)}</span>
        </div>
    `;

    // Auto-hide after 5 seconds
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

/**
 * Show loading state on element
 * @param {HTMLElement} element - Element to show loading
 * @param {boolean} show - Show or hide loading
 */
function showLoading(element, show = true) {
    if (show) {
        element.disabled = true;
        element.dataset.originalText = element.textContent;
        element.innerHTML = '<span class="spinner"></span> Loading...';
    } else {
        element.disabled = false;
        element.textContent = element.dataset.originalText || element.textContent;
    }
}

/**
 * Confirm action with user
 * @param {string} message - Confirmation message
 * @returns {Promise<boolean>} User confirmation
 */
function confirmAction(message) {
    return confirm(message);
}

// ============== VALIDATION ==============

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate GST number format (India)
 * @param {string} gst - GST number to validate
 * @returns {boolean} Is valid GST format
 */
function isValidGST(gst) {
    if (!gst) return true; // Optional field

    // GST format: 2 digits (state) + 10 chars (PAN) + 1 digit + 1 char + 1 digit
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst.toUpperCase());
}

/**
 * Validate PAN number format (India)
 * @param {string} pan - PAN number to validate
 * @returns {boolean} Is valid PAN format
 */
function isValidPAN(pan) {
    if (!pan) return true; // Optional field

    // PAN format: 5 letters + 4 digits + 1 letter
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
}

/**
 * Validate phone number (India)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Is valid phone format
 */
function isValidPhone(phone) {
    if (!phone) return true; // Optional field

    // Indian phone: +91 followed by 10 digits or just 10 digits
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// ============== DATE HELPERS ==============

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get date N days from now
 * @param {number} days - Number of days
 * @returns {string} Future date in YYYY-MM-DD format
 */
function getFutureDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

/**
 * Calculate days between two dates
 * @param {string} date1 - First date
 * @param {string} date2 - Second date
 * @returns {number} Days difference
 */
function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is overdue
 * @param {string} dueDate - Due date
 * @returns {boolean} Is overdue
 */
function isOverdue(dueDate) {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
}

// Export utilities
window.utils = {
    checkAuth,
    logout,
    toggleTheme,
    loadTheme,
    formatCurrency,
    formatDate,
    formatPaymentMethod,
    escapeHtml,
    getStatusBadge,
    showAlert,
    showLoading,
    isValidEmail,
    isValidGST,
    isValidPAN,
    isValidPhone,
    getTodayDate,
    getFutureDate,
    daysBetween,
    isOverdue,
};
