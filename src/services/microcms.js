import { createClient } from 'microcms-js-sdk';

// Initialize the MicroCMS client
// The service domain and API key will be loaded from environment variables (.env.local)

const serviceDomain = import.meta.env.VITE_MICROCMS_SERVICE_DOMAIN;
const apiKey = import.meta.env.VITE_MICROCMS_API_KEY;

export const client = createClient({
    serviceDomain: serviceDomain || 'YOUR_SERVICE_DOMAIN',
    apiKey: apiKey || 'YOUR_API_KEY',
});

/**
 * Fetch all products from the 'products' endpoint in MicroCMS.
 * 
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
    // If no direct API key is available in the browser, fallback to the secure Vercel proxy
    if (!apiKey) {
        try {
            console.log("Fetching products via secure proxy...");
            const response = await fetch('/api/get-products');
            if (!response.ok) {
                throw new Error(`Proxy error: ${response.statusText}`);
            }
            const data = await response.json();
            return data.contents || [];
        } catch (err) {
            console.error("Error fetching products from proxy:", err);
            return [];
        }
    }

    // Local dev mode with direct API Key
    if (!serviceDomain) {
        console.warn("[MicroCMS] Missing service domain. Returning empty array.");
        return [];
    }

    try {
        const response = await client.getList({
            endpoint: 'products',
            queries: {
                limit: 100, // Adjust this based on catalog size
            }
        });
        return response.contents;
    } catch (err) {
        console.error("Error fetching products from MicroCMS:", err);
        return [];
    }
};

/**
 * Create a new order in MicroCMS.
 * @param {Object} orderData 
 */
export const createOrder = async (orderData) => {
    if (apiKey) {
        try {
            const response = await client.create({
                endpoint: 'orders',
                content: orderData,
            });
            console.log("Order successfully created directly via SDK");
            return response;
        } catch (err) {
            console.error("Error creating order directly:", err);
            throw err;
        }
    }

    try {
        const response = await fetch('/api/create-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
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
    // Local dev mode with direct API Key
    if (!serviceDomain) {
        console.warn("[MicroCMS] Missing service domain. Returning empty array.");
        return [];
    }

    // Use the proxy if no direct API key is available
    if (!apiKey) {
        try {
            console.log("Fetching orders via secure proxy...");
            const response = await fetch('/api/get-orders');
            if (!response.ok) {
                throw new Error(`Proxy error: ${response.statusText}`);
            }
            const data = await response.json();
            return data.contents || [];
        } catch (err) {
            console.error("Error fetching orders from proxy:", err);
            return [];
        }
    }

    try {
        const response = await client.getList({
            endpoint: 'orders',
            queries: {
                limit: 100, // Adjust this based on volume
            }
        });
        return response.contents;
    } catch (err) {
        console.error("Error fetching orders from MicroCMS:", err);
        return [];
    }
};

/**
 * Update an existing order via the secure proxy.
 * @param {string} id - The MicroCMS order ID
 * @param {Object} data - payload (status, shippingInfo, etc.)
 */
export const updateOrder = async (id, data) => {
    if (apiKey) {
        try {
            const response = await client.update({
                endpoint: 'orders',
                contentId: id,
                content: data,
            });
            console.log("Order successfully updated directly via SDK");
            return response;
        } catch (err) {
            console.error("Error updating order directly:", err);
            throw err;
        }
    }

    try {
        const response = await fetch('/api/update-order', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
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
 * Fetch all customers from MicroCMS.
 */
export const fetchCustomers = async () => {
    if (!serviceDomain) {
        return [];
    }

    if (!apiKey) {
        try {
            const response = await fetch('/api/get-customers');
            if (!response.ok) throw new Error(`Proxy error: ${response.statusText}`);
            const data = await response.json();
            return data.contents || [];
        } catch (err) {
            console.error("Error fetching customers from proxy:", err);
            return [];
        }
    }

    try {
        const response = await client.getList({
            endpoint: 'customers',
            queries: { limit: 100 }
        });
        return response.contents;
    } catch (err) {
        console.error("Error fetching customers from MicroCMS:", err);
        return [];
    }
};

/**
 * Create a new customer record.
 */
export const createCustomer = async (customerData) => {
    if (apiKey) {
        try {
            const response = await client.create({
                endpoint: 'customers',
                content: customerData,
            });
            return response;
        } catch (err) {
            console.error("Error creating customer directly:", err);
            throw err;
        }
    }

    try {
        const response = await fetch('/api/create-customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customerData)
        });
        if (!response.ok) throw new Error(`Failed to create customer: ${response.statusText}`);
        return await response.json();
    } catch (err) {
        console.error("Error creating customer:", err);
        throw err;
    }
};

/**
 * Update an existing customer record.
 */
export const updateCustomer = async (id, data) => {
    if (apiKey) {
        try {
            const response = await client.update({
                endpoint: 'customers',
                contentId: id,
                content: data,
            });
            return response;
        } catch (err) {
            console.error("Error updating customer directly:", err);
            throw err;
        }
    }

    try {
        const response = await fetch('/api/update-customer', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
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
 * Update an existing product record (price, stock, variants).
 */
export const updateProduct = async (id, data) => {
    if (apiKey) {
        try {
            const response = await client.update({
                endpoint: 'products',
                contentId: id,
                content: data,
            });
            return response;
        } catch (err) {
            console.error("Error updating product directly:", err);
            throw err;
        }
    }

    try {
        const response = await fetch('/api/update-product', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, updates: data })
        });
        if (!response.ok) throw new Error(`Failed to update product: ${response.statusText}`);
        return await response.json();
    } catch (err) {
        console.error("Error updating product:", err);
        throw err;
    }
};
