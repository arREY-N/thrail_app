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
        this.secretKey = secretKey;
        this.webhookSecret = webhookSecret;
        this.encodedKey = Buffer.from(this.secretKey).toString('base64');
        this.baseUrl = 'https://api.paymongo.com/v1';
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
        const sourceType = type === 'maya' ? 'paymaya' : type;

        const response = await fetch(`${this.baseUrl}/checkout_sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${this.encodedKey}`
            },
            body: JSON.stringify({
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
                        payment_method_types: [sourceType],
                        success_url: redirectUrl,
                        cancel_url: redirectUrl,
                        reference_number: metadata.bookingId // Link session to booking
                    }
                }
            })
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            console.error(`[PayMongoProvider] Checkout Error: ${errorDetails}`);
            throw new Error(`PayMongo Checkout Error: ${errorDetails}`);
        }

        const data = await response.json();
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
        const response = await fetch(`${this.baseUrl}/checkout_sessions/${sessionId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${this.encodedKey}`
            }
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            console.error(`[PayMongoProvider] GetCheckoutSession Error: ${errorDetails}`);
            throw new Error(`PayMongo GetCheckoutSession Error: ${errorDetails}`);
        }

        const data = await response.json();
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
     * @param {string} reason - The reason for the refund.
     * @returns {Promise<Object>} The refund object details.
     * @throws {Error} If the API request fails.
     */
    async issueRefund(paymentGatewayId, amount, reason) {
        console.log(`[PayMongoProvider] Issuing refund for payment: ${paymentGatewayId}, amount: ${amount}`);
        // PayMongo refund requires the payment ID (not the checkout session ID)
        const response = await fetch(`${this.baseUrl}/refunds`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${this.encodedKey}`
            },
            body: JSON.stringify({
                data: {
                    attributes: {
                        amount: Math.round(amount * 100),
                        payment_id: paymentGatewayId,
                        reason: reason
                    }
                }
            })
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            console.error(`[PayMongoProvider] Refund Error: ${errorDetails}`);
            throw new Error(`PayMongo Refund Error: ${errorDetails}`);
        }

        const data = await response.json();
        return data.data;
    }
}

module.exports = PayMongoProvider;
