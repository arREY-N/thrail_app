const PaymentManager = require('../../../../functions/services/PaymentManager');

describe('PaymentManager', () => {
    // Reset the singleton state before each test
    beforeEach(() => {
        PaymentManager.providers = {};
    });

    it('should register a provider successfully', () => {
        const mockProvider = { name: 'mock' };
        PaymentManager.registerProvider('paymongo', mockProvider);
        
        expect(PaymentManager.providers['paymongo']).toBe(mockProvider);
    });

    it('should retrieve a registered provider', () => {
        const mockProvider = { name: 'mock' };
        PaymentManager.registerProvider('paymongo', mockProvider);
        
        const retrieved = PaymentManager.getProvider('paymongo');
        expect(retrieved).toBe(mockProvider);
    });

    it('should throw an error when retrieving an unregistered provider', () => {
        expect(() => {
            PaymentManager.getProvider('stripe');
        }).toThrow("Payment gateway 'stripe' is not supported.");
    });
});
