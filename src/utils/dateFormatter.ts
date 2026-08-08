import { Timestamp } from 'firebase/firestore';

export type DateInput = Date | Timestamp | string | number | { toDate?: () => Date; seconds?: number } | null | undefined;

/**
 * Safely parses various date input formats into a valid JavaScript Date object.
 * Falls back to current date if parsing fails completely.
 * 
 * @param {DateInput} dateInput - The date to parse (Date, Firebase Timestamp, String, etc.)
 * @returns {Date} A valid JavaScript Date object
 */
export const safeParseDateString = (dateInput: DateInput): Date => {
    // 1. Empty fallback
    if (!dateInput) return new Date();
    
    // 2. Already a Date object
    if (dateInput instanceof Date) {
        return isNaN(dateInput.getTime()) ? new Date() : dateInput;
    }

    // 3. Firebase Timestamp fallback
    if (typeof dateInput === 'object' && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
        return dateInput.toDate();
    }
    if (typeof dateInput === 'object' && 'seconds' in dateInput && typeof dateInput.seconds === 'number') {
        return new Date(dateInput.seconds * 1000);
    }

    // 4. String Parsing
    const str = String(dateInput).trim();
    
    // REGEX: Explicitly catch "MMM DD, YYYY" (e.g., "Apr 10, 2026")
    // This bypasses the Android Hermes parser entirely for safety.
    const match = str.match(/^([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})$/i);
    if (match) {
        const shortMonths = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        const month = shortMonths.indexOf(match[1].toLowerCase());
        const day = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        
        if (month !== -1 && !isNaN(day) && !isNaN(year)) {
            return new Date(year, month, day);
        }
    }

    // 5. Standard JS Parse (Last resort)
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) return parsed;

    // Ultimate fallback so the UI never crashes with "NaN"
    return new Date(); 
};

// --- 2. DISPLAY FORMATTERS ---

/**
 * Formats a date object or string into standard string format: "MMM DD, YYYY"
 * 
 * @param {any} dateObj - The date to format
 * @returns {string} Formatted string or empty string
 */
export const formatDateToStandard = (dateObj: DateInput): string => {
    if (!dateObj) return '';
    // Ultra-safe parse guarantees 'd' is a valid date
    const d = safeParseDateString(dateObj); 
    
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${shortMonths[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

/**
 * Formats a single date or a date range for a booking.
 * 
 * @param {DateInput} startDateObj - The starting date of the booking
 * @param {DateInput} [endDateObj=null] - The ending date of the booking (optional)
 * @param {boolean} [shortMonth=false] - Whether to use abbreviated month names
 * @returns {string} Formatted date range or "TBA"
 */
export const formatBookingDate = (startDateObj: DateInput, endDateObj: DateInput = null, shortMonth: boolean = false): string => {
    if (!startDateObj) return 'TBA';

    const start = safeParseDateString(startDateObj);
    const end = endDateObj ? safeParseDateString(endDateObj) : null;

    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const months = shortMonth ? shortMonths : fullMonths;
    
    const formatSingleDate = (d: Date) => {
        let hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} • ${hours}:${minutes} ${ampm}`;
    };

    const formatShortDate = (d: Date) => {
        return `${months[d.getMonth()]} ${d.getDate()}`;
    };

    if (!end || (start.toDateString() === end.toDateString())) {
        return formatSingleDate(start);
    }

    return `${formatShortDate(start)} - ${formatShortDate(end)}, ${start.getFullYear()}`;
};

/**
 * Extracts and formats the time portion of a date as "HH:MM AM/PM"
 * 
 * @param {DateInput} dateInput - The date to extract time from
 * @returns {string} Formatted time string
 */
export const formatTime = (dateInput: DateInput): string => {
    if (!dateInput) return '';
    const d = safeParseDateString(dateInput);
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};

/**
 * Formats a duration (in milliseconds) into a readable string (e.g., "1h 15m", "45m", "10s").
 * 
 * @param {number | string | null | undefined} durationMs - The duration in milliseconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (durationMs: number | string | null | undefined): string => {
    const numVal = Number(durationMs);
    if (isNaN(numVal) || numVal < 0) return '--';

    const totalSeconds = Math.round(numVal / 1000);
    if (totalSeconds < 60) return `${totalSeconds}s`;
    
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    const paddedMins = mins.toString().padStart(2, '0');
    const paddedSecs = secs.toString().padStart(2, '0');

    if (hours > 0) {
        return `${hours}:${paddedMins}:${paddedSecs}`;
    }
    return `${mins}:${paddedSecs}`;
};

// --- TIME PARSER ---
/**
 * Parses a string like "02:30 PM" into a Date object (date is set to today).
 * 
 * @param {string} timeString - The time string to parse
 * @returns {Date} Date object with the specified time
 */
export const parseTimeToDate = (timeString: string): Date => {
    const d = new Date();
    d.setHours(0, 0, 0, 0); 
    
    try {
        const [timePart, period] = timeString.split(' ');
        let [hoursStr, minutesStr] = timePart ? timePart.split(':') : ['', ''];
        
        let hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10) || 0;

        if (isNaN(hours)) hours = 0; 

        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        d.setHours(hours, minutes, 0, 0);
    } catch(e) {}
    
    return d; 
};

// --- 3. INPUT FORMATTERS (MM/DD/YYYY & MM/DD/YY) ---
/**
 * Formats a date into "MM/DD/YYYY" format.
 * 
 * @param {DateInput} dateInput - The date to format
 * @returns {string} Formatted string
 */
export const formatToMMDDYYYY = (dateInput: DateInput): string => {
    if (!dateInput) return '';
    const d = safeParseDateString(dateInput);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    return `${mm}/${dd}/${yyyy}`;
};

/**
 * Formats a date into "MM/DD/YY" format.
 * 
 * @param {DateInput} dateInput - The date to format
 * @returns {string} Formatted string
 */
export const formatToMMDDYY = (dateInput: DateInput): string => {
    if (!dateInput) return '';
    const d = safeParseDateString(dateInput);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
};

// --- Check if Minor ---
/**
 * Checks if the provided birthdate indicates the person is a minor (under 18).
 * 
 * @param {DateInput} dateInput - The birthdate to check
 * @returns {boolean} True if the person is under 18
 */
export const checkIfMinor = (dateInput: DateInput): boolean => {
    if (!dateInput) return false;
    
    const bday = safeParseDateString(dateInput);
    if (isNaN(bday.getTime())) return false;

    const today = new Date();
    let age = today.getFullYear() - bday.getFullYear();
    const m = today.getMonth() - bday.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) {
        age--;
    }
    
    return age < 18;
};

// --- Calculate Age ---
/**
 * Calculates a person's age based on their birthdate.
 * 
 * @param {DateInput} dateInput - The birthdate to check
 * @returns {number} The calculated age, or 0 if invalid
 */
export const calculateAge = (dateInput: DateInput): number => {
    if (!dateInput) return 0;
    
    const bday = safeParseDateString(dateInput);
    if (isNaN(bday.getTime())) return 0;

    const today = new Date();
    let age = today.getFullYear() - bday.getFullYear();
    const m = today.getMonth() - bday.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) {
        age--;
    }
    
    return age;
};

// --- Notification Update ---
/**
 * Generates a human-readable text for recent updates (e.g. "Updated 5m ago").
 * Only returns text if the update was within the last 24 hours.
 * 
 * @param {DateInput} updatedAt - The date of the last update
 * @param {DateInput} createdAt - Fallback date if updatedAt is null
 * @returns {string | null} Formatted relative time string or null
 */
export const getRecentUpdateText = (updatedAt: DateInput, createdAt?: DateInput): string | null => {
    const timestamp = updatedAt || createdAt;
    if (!timestamp) return null;

    const date = safeParseDateString(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffMins = diffMs / (1000 * 60);

    // Only show badge if updated within the last 24 hours
    if (diffHours < 24 && diffHours >= 0) {
        if (diffMins < 1) return 'Updated just now';
        if (diffMins < 60) return `Updated ${Math.floor(diffMins)}m ago`;
        return `Updated ${Math.floor(diffHours)}h ago`;
    }
    return null;
};

/**
 * Calculates a short human-readable string for elapsed time (e.g., "1m", "2h", "3d").
 * 
 * @param {string | number | Date} dateInput - The timestamp to compare against now
 * @returns {string} The formatted shorthand elapsed time string
 */
export const getShortTimeElapsed = (dateInput: string | number | Date): string => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHrs < 24) return `${diffHrs}h`;
    return `${diffDays}d`;
};

/**
 * Extracts initials from a given name string.
 * - If there are multiple words, returns the first letter of the first word and the first letter of the second word.
 * - If there is only one word, returns the first two letters of that word.
 * - Returns "?" if the name is invalid or empty.
 * 
 * @param {string} [name] - The name to extract initials from
 * @returns {string} The computed initials in uppercase
 */
export const getInitials = (name?: string): string => {
    if (!name) return '?';
    const trimmed = name.trim();
    if (!trimmed) return '?';

    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
        const firstInitial = words[0].charAt(0);
        const secondInitial = words[1].charAt(0);
        return (firstInitial + secondInitial).toUpperCase();
    }

    const word = words[0];
    if (word.length >= 2) {
        return word.substring(0, 2).toUpperCase();
    }
    return word.toUpperCase();
};

/**
 * Helper to parse and format activity times robustly to a 12-hour string.
 * 
 * @param time - Raw time representation (Timestamp, Date, or string).
 * @returns A formatted 12-hour time string.
 */
export const formatActivityTime = (time: unknown): string => {
    if (!time) return '--:--';
    let date: Date;
    if (time && typeof time === 'object' && 'toDate' in time && typeof (time as { toDate: unknown }).toDate === 'function') {
        date = (time as { toDate: () => Date }).toDate();
    } else if (time instanceof Date) {
        date = time;
    } else {
        const strVal = String(time);
        if (strVal.includes(':') && (strVal.toLowerCase().includes('am') || strVal.toLowerCase().includes('pm'))) {
            return strVal;
        }
        date = new Date(strVal);
    }
    
    if (isNaN(date.getTime())) {
        return String(time);
    }
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};


