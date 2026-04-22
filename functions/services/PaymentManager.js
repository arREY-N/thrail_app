/**
 * PaymentManager handles the registry and resolution of multiple payment gateway providers.
 * Follows the Strategy pattern.
 * 
 * @class PaymentManager
 */
class PaymentManager {
    constructor() {
        /** @type {Object.<string, any>} */
        this.providers = {};
    }

    /**
     * Registers a payment provider instance for a specific gateway name.
     * @param {string} gateway - The identifier for the gateway (e.g., 'paymongo').
     * @param {Object} provider - The initialized provider instance.
     */
    registerProvider(gateway, provider) {
        this.providers[gateway] = provider;
        console.log(`[PaymentManager] Registered payment provider for gateway: ${gateway}`);
    }

    /**
     * Retrieves a registered payment provider by gateway name.
     * @param {string} gateway - The identifier for the gateway.
     * @returns {Object} The registered provider instance.
     * @throws {Error} If the requested gateway is not registered.
     */
    getProvider(gateway) {
        const provider = this.providers[gateway];
        if (!provider) {
            console.error(`[PaymentManager] Attempted to access unsupported gateway: ${gateway}`);
            throw new Error(`Payment gateway '${gateway}' is not supported.`);
        }
        return provider;
    }
}

module.exports = new PaymentManager();
