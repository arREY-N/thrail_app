/**
 * @file phone.ts
 * @description Pure stateless domain helper for normalizing phone numbers.
 * Converts Philippine mobile variations (+63, 63, leading 0, spaces, dashes)
 * into standard canonical 11-digit format (09XXXXXXXXX) without UI or component dependencies.
 */

/**
 * Normalizes any Philippine phone number to standard 11-digit format: 09XXXXXXXXX.
 *
 * @param rawPhone - Raw phone string with optional country code, spaces, or dashes.
 * @returns Canonical 11-digit phone number (e.g. "09171234567") or empty string if invalid.
 */
export const normalizePhoneNumber = (rawPhone?: string): string => {
    if (!rawPhone) return '';
    let digits = rawPhone.replace(/\D/g, '');

    if (digits.startsWith('63')) {
        digits = digits.substring(2);
    } else if (digits.startsWith('0')) {
        digits = digits.substring(1);
    }

    if (digits.length === 10) {
        return '0' + digits;
    }

    return digits;
};
