import { auth } from './firebase.js';

/**
 * Utility to generate Authentication headers securely using Firebase ID Tokens.
 */
const getAuthHeaders = async () => {
    const headers = { 'Content-Type': 'application/json' };
    if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

/**
 * Fetch all products from the 'products' endpoint in MicroCMS.
 * Expected MicroCMS Schema (API ID: 'products'):
 * - title (Text)
 * - sku (Text)
 * - category (Text)
 * - basePrice (Number)
 * - stock (Number)
 * - image (Image)
 * - description (Rich Editor)
 */
export const fetchProducts = async () => {
    try {
        console.log("Fetching products via secure proxy...");
        const headers = await getAuthHeaders();
        const response = await fetch('/api/get-products', { headers });
        if (!response.ok) {
            throw new Error(`Proxy error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.contents || [];
    } catch (err) {
        console.error("Error fetching products from proxy:", err);
        return [];
    }
};

/**
 * Create a new order in MicroCMS.
 * @param {Object} orderData 
 */
export const createOrder = async (orderData) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch('/api/create-order', {
            method: 'POST',
            headers,
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            throw new Error(`Failed to create order via proxy: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Order successfully created via secure proxy", data);
        return data;
    } catch (err) {
        console.error("Error creating order:", err);
        throw err;
    }
};

/**
 * Fetch all orders from MicroCMS.
 */
export const fetchOrders = async () => {
    try {
        console.log("Fetching orders via secure proxy...");
        const headers = await getAuthHeaders();
        const response = await fetch('/api/get-orders', { headers });
        if (!response.ok) {
            throw new Error(`Proxy error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.contents || [];
    } catch (err) {
        console.error("Error fetching orders from proxy:", err);
        return [];
    }
};

/**
 * Update an existing order via the secure proxy.
 * @param {string} id - The MicroCMS order ID
 * @param {Object} data - payload (status, shippingInfo, etc.)
 */
export const updateOrder = async (id, data) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch('/api/update-order', {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ id, ...data })
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(`Failed to update order: ${errBody.error || response.statusText}`);
        }

        const result = await response.json();
        console.log("Order successfully updated via proxy");
        return result;
    } catch (err) {
        console.error("Error updating order:", err);
        throw err;
    }
};

/**
 * Delete a specific order record.
 */
export const deleteOrder = async (orderId) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/delete-order?id=${orderId}`, {
            method: 'DELETE',
            headers
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(`Failed to delete order: ${errBody.error || response.statusText}`);
        }

        const result = await response.json();
        console.log("Order successfully deleted via proxy");
        return result;
    } catch (err) {
        console.error("Error deleting order:", err);
        throw err;
    }
};

/**
 * Fetch all customers from MicroCMS.
 */
export const fetchCustomers = async () => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch('/api/get-customers', { headers });
        if (!response.ok) throw new Error(`Proxy error: ${response.statusText}`);
        const data = await response.json();
        return data.contents || [];
    } catch (err) {
        console.error("Error fetching customers from proxy:", err);
        return [];
    }
};

/**
 * Create a new customer record.
 */
export const createCustomer = async (customerData) => {
    try {
        const token = await getAuthToken();
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        const response = await fetch('/api/create-customer', {
            method: 'POST',
            headers,
            body: JSON.stringify(customerData)
        });
        if (!response.ok) {
            const rawText = await response.text();
            throw new Error(`\n\nHTTP ${response.status} ${response.statusText}\nBody: ${rawText.substring(0, 500)}`);
        }
        return await response.json();
    } catch (err) {
        console.error("Error creating customer:", err);
        throw err;
    }
};

/**
 * Delete a customer
 */
export const deleteCustomer = async (id) => {
    try {
        const token = await getAuthToken();
        const headers = getHeaders(token);
        const response = await fetch(`/api/delete-customer?id=${id}`, {
            method: 'DELETE',
            headers
        });
        if (!response.ok) {
            const errBody = await response.json().catch(()=>null);
            throw new Error(`Failed to delete customer: ${errBody ? JSON.stringify(errBody) : response.statusText}`);
        }
        return await response.json();
    } catch (err) {
        console.error("Error deleting customer:", err);
        throw err;
    }
};

/**
 * Update an existing customer record.
 */
export const updateCustomer = async (id, data) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch('/api/update-customer', {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ id, ...data })
        });
        if (!response.ok) throw new Error(`Failed to update customer: ${response.statusText}`);
        return await response.json();
    } catch (err) {
        console.error("Error updating customer:", err);
        throw err;
    }
};

/**
 * Update product stock.
 */
export const updateProduct = async (id, stock) => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch('/api/update-product', {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ id, stock })
        });
        if (!response.ok) throw new Error(`Failed to update product: ${response.statusText}`);
        return await response.json();
    } catch (err) {
        console.error("Error updating product:", err);
        throw err;
    }
};
