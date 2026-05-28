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

// --- 2. DISPLAY FORMATTERS ---

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

// --- TIME PARSER ---
export const parseTimeToDate = (timeString) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0); 
    
    try {
        const [timePart, period] = timeString.split(' ');
        let [hours, minutes] = timePart ? timePart.split(':') : ['', ''];
        
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10) || 0;

        if (isNaN(hours)) hours = 0; 

        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        d.setHours(hours, minutes, 0, 0);
    } catch(e) {}
    
    return d; 
};

// --- 3. INPUT FORMATTERS (MM/DD/YYYY & MM/DD/YY) ---
export const formatToMMDDYYYY = (dateInput) => {
    if (!dateInput) return '';
    const d = safeParseDateString(dateInput);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    return `${mm}/${dd}/${yyyy}`;
};

export const formatToMMDDYY = (dateInput) => {
    if (!dateInput) return '';
    const d = safeParseDateString(dateInput);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
};

// --- Check if Minor ---
export const checkIfMinor = (dateInput) => {
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

// --- Notification Update ---
export const getRecentUpdateText = (updatedAt, createdAt) => {
    const timestamp = updatedAt || createdAt;
    if (!timestamp) return null;

    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
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