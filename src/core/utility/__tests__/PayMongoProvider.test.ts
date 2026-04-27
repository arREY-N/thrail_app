const PayMongoProvider = require('../../../../functions/services/providers/PayMongoProvider');
const crypto = require('crypto');

// Mock the global fetch API
global.fetch = jest.fn() as any;

describe('PayMongoProvider', () => {
    const SECRET_KEY = 'sk_test_123';
    const WEBHOOK_SECRET = 'whsk_test_456';
    let provider: any;

    beforeEach(() => {
        provider = new PayMongoProvider(SECRET_KEY, WEBHOOK_SECRET);
        (global.fetch as jest.Mock).mockClear();
    });

    describe('verifyWebhookSignature', () => {
        it('should return true if webhook secret is not set', () => {
            const providerNoSecret = new PayMongoProvider(SECRET_KEY, null);
            const result = providerNoSecret.verifyWebhookSignature(Buffer.from('payload'), 'fake-sig');
            expect(result).toBe(true);
        });

        it('should return false if signature format is invalid', () => {
            const result = provider.verifyWebhookSignature(Buffer.from('payload'), 'invalid-sig-format');
            expect(result).toBe(false);
        });

        it('should successfully verify a valid signature', () => {
            const payload = '{"data":{"attributes":{"type":"payment.paid"}}}';
            const timestamp = Math.floor(Date.now() / 1000).toString();
            
            // Create a valid signature for the test
            const signaturePayload = `${timestamp}.${payload}`;
            const expectedSignature = crypto
                .createHmac('sha256', WEBHOOK_SECRET)
                .update(signaturePayload)
                .digest('hex');

            const signatureHeader = `t=${timestamp},te=${expectedSignature},li=${expectedSignature}`;

            const result = provider.verifyWebhookSignature(Buffer.from(payload), signatureHeader);
            expect(result).toBe(true);
        });

        it('should fail verification if signature does not match payload', () => {
            const payload = '{"data":{"attributes":{"type":"payment.paid"}}}';
            const timestamp = Math.floor(Date.now() / 1000).toString();
            
            // Expected signature generated with wrong secret
            const signaturePayload = `${timestamp}.${payload}`;
            const wrongSignature = crypto
                .createHmac('sha256', 'wrong_secret')
                .update(signaturePayload)
                .digest('hex');

            const signatureHeader = `t=${timestamp},te=${wrongSignature},li=${wrongSignature}`;

            const result = provider.verifyWebhookSignature(Buffer.from(payload), signatureHeader);
            expect(result).toBe(false);
        });
    });

    describe('createCheckout', () => {
        it('should call fetch with correct parameters and return session data', async () => {
            const mockResponse = {
                ok: true,
                json: async () => ({
                    data: {
                        id: 'cs_test_123',
                        attributes: { checkout_url: 'https://checkout.paymongo.com/cs_test_123' }
                    }
                })
            };
            (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

            const result = await provider.createCheckout(1000, 'gcash', 'app://', { bookingId: 'b_1' });

            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(result).toEqual({
                id: 'cs_test_123',
                checkout_url: 'https://checkout.paymongo.com/cs_test_123',
                status: 'pending'
            });
        });

        it('should throw an error if the API request fails', async () => {
            const mockResponse = {
                ok: false,
                text: async () => 'Invalid parameters'
            };
            (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

            await expect(provider.createCheckout(1000, 'gcash', 'app://', { bookingId: 'b_1' }))
                .rejects
                .toThrow('PayMongo Checkout Error: Invalid parameters');
        });
    });
});
