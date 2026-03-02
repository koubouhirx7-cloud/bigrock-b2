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
    if (!serviceDomain || !apiKey) {
        console.warn("[MicroCMS] Missing API keys. Cannot create order.");
        return null;
    }

    try {
        const response = await client.create({
            endpoint: 'orders',
            content: orderData,
        });
        return response;
    } catch (err) {
        console.error("Error creating order in MicroCMS:", err);
        throw err;
    }
};
