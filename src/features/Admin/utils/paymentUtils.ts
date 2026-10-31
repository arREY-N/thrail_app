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
