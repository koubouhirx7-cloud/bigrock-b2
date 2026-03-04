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
    if (!serviceDomain || !apiKey) {
        console.warn("[MicroCMS] Missing API keys. Returning empty array.");
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
