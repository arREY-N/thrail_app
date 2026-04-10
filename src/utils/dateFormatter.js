// --- 1. CORE PARSER (Android/Hermes Safe) ---
export const safeParseDateString = (dateInput) => {
    // 1. Empty fallback
    if (!dateInput) return new Date();
    
    // 2. Already a Date object
    if (dateInput instanceof Date) {
        return isNaN(dateInput.getTime()) ? new Date() : dateInput;
    }

    // 3. Firebase Timestamp fallback
    if (dateInput.toDate && typeof dateInput.toDate === 'function') {
        return dateInput.toDate();
    }
    if (dateInput.seconds) {
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

// --- 2. FORMATTERS ---

export const formatDateToStandard = (dateObj) => {
    if (!dateObj) return '';
    // Ultra-safe parse guarantees 'd' is a valid date
    const d = safeParseDateString(dateObj); 
    
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${shortMonths[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

export const formatBookingDate = (startDateObj, endDateObj = null, shortMonth = false) => {
    if (!startDateObj) return 'TBA';
    
    const start = safeParseDateString(startDateObj);
    const end = endDateObj ? safeParseDateString(endDateObj) : null;

    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const months = shortMonth ? shortMonths : fullMonths;
    
    const formatSingleDate = (d) => {
        let hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} • ${hours}:${minutes} ${ampm}`;
    };

    const formatShortDate = (d) => {
        return `${months[d.getMonth()]} ${d.getDate()}`;
    };

    if (!end || (start.toDateString() === end.toDateString())) {
        return formatSingleDate(start);
    }

    return `${formatShortDate(start)} - ${formatShortDate(end)}, ${start.getFullYear()}`;
};

export const formatTime = (dateInput) => {
    if (!dateInput) return '';
    const d = safeParseDateString(dateInput);
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};