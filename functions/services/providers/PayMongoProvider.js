const crypto = require('crypto');
const { Buffer } = require('buffer');

/**
 * PayMongoProvider handles integration with the PayMongo API.
 * Supports Checkout Sessions, Webhook Signature Verification, and Refunds.
 * 
 * @class PayMongoProvider
 */
class PayMongoProvider {
    /**
     * @param {string} secretKey - The PayMongo Secret Key.
     * @param {string} [webhookSecret=null] - The PayMongo Webhook Secret for signature verification.
     */
    constructor(secretKey, webhookSecret = null) {
        if (!secretKey) {
            throw new Error('PayMongoProvider requires a secretKey.');
        }
        this.secretKey = secretKey.trim();
        this.webhookSecret = webhookSecret;
        // RFC 7617: HTTP Basic Auth requires username:password format.
        // PayMongo uses secretKey as the username with an empty password.
        this.encodedKey = Buffer.from(`${this.secretKey}:`).toString('base64');
        this.baseUrl = 'https://api.paymongo.com/v1';
    }

    /**
     * Centralized, standard HTTP client for all PayMongo API interactions.
     * Enforces RFC compliance, standard headers, and clean structured error parsing.
     * 
     * @private
     * @param {string} endpoint - API path (e.g. '/checkout_sessions' or '/refunds').
     * @param {Object} options - Fetch options (method, body, custom headers).
     * @returns {Promise<Object>} Parsed JSON response.
     * @throws {Error} If the API request fails.
     */
    async _request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
        const headers = {
            'Accept': 'application/json, application/vnd.api+json',
            'Content-Type': 'application/json',
            'Authorization': `Basic ${this.encodedKey}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            ...(options.headers || {})
        };

        const config = {
            ...options,
            headers
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        const response = await fetch(url, config);

        if (!response.ok) {
            let errorMessage = `Payment Gateway Error (${response.status})`;
            try {
                const contentType = response.headers.get('content-type') || '';
                // PayMongo returns 'application/vnd.api+json' per the JSON:API standard
                if (contentType.includes('json')) {
                    const errorJson = await response.json();
                    if (errorJson.errors && Array.isArray(errorJson.errors) && errorJson.errors.length > 0) {
                        errorMessage = errorJson.errors.map(e => e.detail || e.code).join('; ');
                    }
                } else {
                    const rawText = await response.text();
                    console.error(`[PayMongoProvider] Non-JSON Gateway Error (${response.status} on ${endpoint}):`, rawText);
                    if (response.status === 403) {
                        errorMessage = 'Payment gateway access denied (403 Forbidden). Please check your PayMongo API credentials or gateway permissions.';
                    } else if (response.status >= 500) {
                        errorMessage = 'Payment gateway server is temporarily unavailable. Please try again shortly.';
                    } else {
                        errorMessage = rawText.slice(0, 150);
                    }
                }
            } catch (parseErr) {
                console.error(`[PayMongoProvider] Error parsing failure response (${response.status} on ${endpoint}):`, parseErr);
            }
            console.error(`[PayMongoProvider] API Error (${response.status} on ${endpoint}):`, errorMessage);
            throw new Error(`PayMongo API Error: ${errorMessage}`);
        }

        return await response.json();
    }

    /**
     * Creates a new Checkout Session.
     * 
     * @param {number} amount - The amount in PHP.
     * @param {string} type - The payment method (e.g., 'gcash').
     * @param {string} redirectUrl - The deep link URL for success/cancel.
     * @param {Object} metadata - Metadata to attach (must include bookingId).
     * @returns {Promise<Object>} The checkout session details.
     * @throws {Error} If the API request fails.
     */
    async createCheckout(amount, type, redirectUrl, metadata) {
        console.log(`[PayMongoProvider] Creating checkout session for amount: ${amount}, method: ${type}`);
        const supportedMethods = ['gcash', 'paymaya'];
        const primaryMethod = type === 'maya' ? 'paymaya' : type;
        const paymentMethodTypes = [
            primaryMethod,
            ...supportedMethods.filter((m) => m !== primaryMethod)
        ];

        const data = await this._request('/checkout_sessions', {
            method: 'POST',
            body: {
                data: {
                    attributes: {
                        send_email_receipt: false,
                        show_description: false,
                        show_line_items: true,
                        line_items: [
                            {
                                currency: 'PHP',
                                amount: Math.round(amount * 100),
                                name: 'Booking Payment',
                                quantity: 1
                            }
                        ],
                        payment_method_types: paymentMethodTypes,
                        success_url: redirectUrl,
                        cancel_url: redirectUrl,
                        reference_number: metadata.bookingId // Link session to booking
                    }
                }
            }
        });

        return {
            id: data.data.id,
            checkout_url: data.data.attributes.checkout_url,
            createdAt: data.data.attributes.created_at, // PayMongo Unix timestamp
            paymentIntentId: data.data.attributes.payment_intent?.id || null,
            status: 'pending'
        };
    }

    /**
     * Fetches an existing Checkout Session by its ID.
     * Used by the webhook to retrieve the reference_number (bookingId) linked to a payment.
     * 
     * @param {string} sessionId - The PayMongo Checkout Session ID (cs_...).
     * @returns {Promise<Object>} The raw session data object.
     * @throws {Error} If the API request fails.
     */
    async getCheckoutSession(sessionId) {
        console.log(`[PayMongoProvider] Fetching checkout session: ${sessionId}`);
        const data = await this._request(`/checkout_sessions/${sessionId}`, {
            method: 'GET'
        });
        return data.data;
    }

    /**
     * Verifies the authenticity of an incoming PayMongo webhook.
     * 
     * @param {Buffer} payloadBuffer - The raw request body buffer.
     * @param {string} signatureHeader - The 'paymongo-signature' header.
     * @returns {boolean} True if the signature is valid, false otherwise.
     */
    verifyWebhookSignature(payloadBuffer, signatureHeader) {
        if (!this.webhookSecret) {
            console.warn('[PayMongoProvider] No webhook secret configured, skipping signature verification.');
            return true; 
        }

        const parts = signatureHeader.split(',');
        let timestamp, testSignature, liveSignature;

        parts.forEach(part => {
            const [key, value] = part.split('=');
            if (key === 't') timestamp = value;
            if (key === 'te') testSignature = value;
            if (key === 'li') liveSignature = value;
        });

        const signature = liveSignature || testSignature;
        if (!timestamp || !signature) return false;

        const signaturePayload = `${timestamp}.${payloadBuffer.toString('utf8')}`;
        const expectedSignature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(signaturePayload)
            .digest('hex');

        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }

    /**
     * Issues a refund for a previously captured payment.
     * 
     * @param {string} paymentGatewayId - The PayMongo Payment ID (pay_...).
     * @param {number} amount - The amount to refund in PHP.
     * @param {string} [reason] - The reason for the refund ('duplicate', 'fraudulent', 'others').
     * @param {string} [notes] - Optional internal notes for the refund.
     * @returns {Promise<Object>} The refund object details.
     * @throws {Error} If the API request fails.
     */
    async issueRefund(paymentGatewayId, amount, reason, notes) {
        console.log(`[PayMongoProvider] Issuing refund for payment: ${paymentGatewayId}, amount: ${amount}, reason: ${reason}`);
        
        if (!paymentGatewayId || !paymentGatewayId.startsWith('pay_')) {
            throw new Error(`Invalid payment gateway ID: '${paymentGatewayId}'. PayMongo refunds require a payment ID starting with 'pay_'.`);
        }

        // PayMongo strictly accepts only: 'duplicate', 'fraudulent', or 'others'
        const validReasons = ['duplicate', 'fraudulent', 'others'];
        const sanitizedReason = validReasons.includes(reason) ? reason : 'others';

        const attributes = {
            amount: Math.round(amount * 100),
            payment_id: paymentGatewayId,
            reason: sanitizedReason
        };

        if (notes && typeof notes === 'string' && notes.trim().length > 0) {
            attributes.notes = notes.trim().slice(0, 255);
        } else if (reason && reason !== sanitizedReason) {
            attributes.notes = `Refund requested: ${reason}`.slice(0, 255);
        }

        const data = await this._request('/refunds', {
            method: 'POST',
            body: {
                data: {
                    attributes
                }
            }
        });

        return data.data;
    }
}

module.exports = PayMongoProvider;
