/**
 * @file paymentUtils.ts
 * @description Shared payment helper utilities for admin review and receipts.
 */

import { IPayment } from '@/src/core/models/Booking/Booking';

/**
 * Extracts the admin-verified reference code and clean admin note from a payment record.
 * Prioritizes admin-entered reference codes over auto-generated fallbacks.
 */
export const getDisplayReferenceCode = (payment: IPayment<Date>): { refCode: string; note?: string } => {
    const rawNote = payment.adminNote || '';

    // Look for "Ref: <value>" in adminNote
    const refMatch = rawNote.match(/Ref:\s*([^\s|]+(?:\s+[^\s|]+)*)/i);
    let refCode = refMatch ? refMatch[1].trim() : null;

    // Clean out the Ref: portion from adminNote to extract the clean user note
    const cleanNote = rawNote
        .replace(/Ref:\s*[^\s|]+(?:\s+[^\s|]+)*/i, '')
        .replace(/^\s*\|\s*|\s*\|\s*$/g, '')
        .trim();

    // If no ref in adminNote, check payment.referenceCode (skip generated MANUAL-, CASH-, manual_, REF-)
    if (!refCode && payment.referenceCode) {
        const isGenerated = payment.referenceCode.startsWith('MANUAL-') || 
                            payment.referenceCode.startsWith('CASH-') || 
                            payment.referenceCode.startsWith('manual_') ||
                            payment.referenceCode.startsWith('REF-');
        if (!isGenerated) {
            refCode = payment.referenceCode;
        }
    }

    // If still no refCode, check gatewayId (for PayMongo pay_...)
    if (!refCode && payment.gatewayId) {
        refCode = payment.gatewayId;
    }

    return {
        refCode: refCode || (payment.status === 'captured' ? 'Verified by Admin' : 'Pending Verification'),
        note: cleanNote || undefined,
    };
};

/**
 * Sanitizes currency input:
 * 1. Strips all characters except digits and decimal point.
 * 2. Preserves only the first decimal point.
 * 3. Strips leading zeros before whole numbers (e.g. 005 -> 5, preserving 0.).
 * 4. Caps decimal precision to 2 decimal places and whole digits to max 7 digits (max 9999999.99).
 */
export const sanitizeCurrencyInput = (text: string, maxWholeDigits = 7): string => {
    let cleaned = text.replace(/[^0-9.]/g, '');
    const dotIndex = cleaned.indexOf('.');
    if (dotIndex !== -1) {
        cleaned = cleaned.slice(0, dotIndex + 1) + cleaned.slice(dotIndex + 1).replace(/\./g, '');
    }
    const parts = cleaned.split('.');
    let integerPart = parts[0];
    if (integerPart.length > 1 && integerPart.startsWith('0')) {
        integerPart = integerPart.replace(/^0+/, '');
        if (integerPart === '') integerPart = '0';
    }
    if (maxWholeDigits > 0) {
        integerPart = integerPart.slice(0, maxWholeDigits);
    }
    if (parts.length > 1) {
        return `${integerPart}.${parts[1].slice(0, 2)}`;
    }
    return dotIndex !== -1 ? `${integerPart}.` : integerPart;
};
