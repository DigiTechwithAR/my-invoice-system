/**
 * API Client for Invoice System
 * Handles all communication with the Cloudflare Worker backend
 */

// API Base URL - Update this to your deployed Worker URL (include /api prefix)
const API_BASE_URL = (typeof window !== 'undefined' && window.API_URL)
    ? `${window.API_URL}/api`
    : 'https://invoice-system-api.digitechwithar.workers.dev/api';

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (without /api prefix)
 * @param {object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Add auth token if available
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                error: data.error || 'Request failed',
                status: response.status,
            };
        }

        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        return {
            error: error.message || 'Network error. Please try again.',
        };
    }
}

// ============== AUTH ENDPOINTS ==============

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<any>} Login response with token and user data
 */
async function login(email, password) {
    return apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

/**
 * Get current user profile
 * @returns {Promise<any>} User profile data
 */
async function getProfile() {
    return apiRequest('/profile');
}

/**
 * Update user profile
 * @param {object} data - Profile data to update
 * @returns {Promise<any>} Update response
 */
async function updateProfile(data) {
    return apiRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

// ============== DASHBOARD ENDPOINTS ==============

/**
 * Get dashboard statistics and recent invoices
 * @returns {Promise<any>} Dashboard data
 */
async function getDashboard() {
    return apiRequest('/dashboard');
}

// ============== CLIENT ENDPOINTS ==============

/**
 * Get all clients
 * @returns {Promise<any>} List of clients
 */
async function getClients() {
    return apiRequest('/clients');
}

/**
 * Get single client by ID
 * @param {number} id - Client ID
 * @returns {Promise<any>} Client data
 */
async function getClient(id) {
    return apiRequest(`/clients/${id}`);
}

/**
 * Create a new client
 * @param {object} clientData - Client data
 * @returns {Promise<any>} Created client
 */
async function createClient(clientData) {
    return apiRequest('/clients', {
        method: 'POST',
        body: JSON.stringify(clientData),
    });
}

/**
 * Update an existing client
 * @param {number} id - Client ID
 * @param {object} clientData - Updated client data
 * @returns {Promise<any>} Updated client
 */
async function updateClient(id, clientData) {
    return apiRequest(`/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(clientData),
    });
}

/**
 * Delete a client
 * @param {number} id - Client ID
 * @returns {Promise<any>} Delete response
 */
async function deleteClient(id) {
    return apiRequest(`/clients/${id}`, {
        method: 'DELETE',
    });
}

// ============== INVOICE ENDPOINTS ==============

/**
 * Get all invoices
 * @returns {Promise<any>} List of invoices
 */
async function getInvoices() {
    return apiRequest('/invoices');
}

/**
 * Get single invoice with items and payments
 * @param {number} id - Invoice ID
 * @returns {Promise<any>} Invoice details
 */
async function getInvoice(id) {
    return apiRequest(`/invoices/${id}`);
}

/**
 * Create a new invoice
 * @param {object} invoiceData - Invoice data with items
 * @returns {Promise<any>} Created invoice
 */
async function createInvoice(invoiceData) {
    return apiRequest('/invoices', {
        method: 'POST',
        body: JSON.stringify(invoiceData),
    });
}

/**
 * Update an existing invoice
 * @param {number} id - Invoice ID
 * @param {object} invoiceData - Updated invoice data
 * @returns {Promise<any>} Updated invoice
 */
async function updateInvoice(id, invoiceData) {
    return apiRequest(`/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(invoiceData),
    });
}

/**
 * Delete an invoice
 * @param {number} id - Invoice ID
 * @returns {Promise<any>} Delete response
 */
async function deleteInvoice(id) {
    return apiRequest(`/invoices/${id}`, {
        method: 'DELETE',
    });
}

// ============== PAYMENT ENDPOINTS ==============

/**
 * Record a new payment
 * @param {number} invoiceId - Invoice ID
 * @param {object} paymentData - Payment data
 * @returns {Promise<any>} Created payment
 */
async function createPayment(invoiceId, paymentData) {
    return apiRequest(`/payments?invoice_id=${invoiceId}`, {
        method: 'POST',
        body: JSON.stringify(paymentData),
    });
}

/**
 * Get payments for an invoice
 * @param {number} invoiceId - Invoice ID
 * @returns {Promise<any>} List of payments
 */
async function getPayments(invoiceId) {
    return apiRequest(`/payments/${invoiceId}`);
}

// ============== EXPORT ENDPOINTS ==============

/**
 * Export all data as JSON
 * @returns {Promise<any>} Exported data
 */
async function exportData() {
    return apiRequest('/export');
}

// Export functions for use in other modules
window.api = {
    login,
    getProfile,
    updateProfile,
    getDashboard,
    getClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,
    getInvoices,
    getInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    createPayment,
    getPayments,
    exportData,
};
