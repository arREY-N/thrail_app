/**
 * @file paymentConfig.ts
 * @description Centralized payment provider configuration.
 * Allows decoupling and switching between manual QR payments and PayMongo gateway.
 */

export type PaymentProvider = 'manual_qr' | 'paymongo';

export interface PaymentConfiguration {
    /**
     * Active payment provider for checkout and refunds.
     * Defaulted to 'manual_qr' while keeping all PayMongo code intact and available.
     */
    PROVIDER: PaymentProvider;
}

export const PAYMENT_CONFIG: PaymentConfiguration = {
    PROVIDER: 'manual_qr',
};
