export const formatBookingDate = (startDateObj, endDateObj = null, shortMonth = false) => {
    if (!startDateObj) return 'TBA';
    
    const parseDate = (dObj) => {
        if (!dObj) return null;
        let d = dObj;
        if (typeof dObj.toDate === 'function') d = dObj.toDate();
        else if (dObj.seconds) d = new Date(dObj.seconds * 1000);
        else if (!(dObj instanceof Date)) d = new Date(dObj);
        return isNaN(d.getTime()) ? null : d;
    };

    const start = parseDate(startDateObj);
    const end = parseDate(endDateObj);

    if (!start) return 'Invalid Date';

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

export const formatTime = (date) => {
    if (!date) return '';
    
    const d = new Date(date);
    
    if (isNaN(d.getTime())) return '';

    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};

// Formats Firebase Timestamps or Date objects into a clean "MMM DD, YYYY" string
export const formatDateToStandard = (dateObj) => {
    if (!dateObj) return '';

    let d;
    if (typeof dateObj.toDate === 'function') {
        d = dateObj.toDate();
    } else if (dateObj instanceof Date) {
        d = dateObj;
    } else if (dateObj.seconds) {
        d = new Date(dateObj.seconds * 1000);
    } else {
        d = new Date(dateObj);
    }

    if (isNaN(d.getTime())) return 'Invalid Date';

    const shortMonths = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    return `${shortMonths[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

// Android/Hermes Safe String Parser for "MMM DD, YYYY" back to a Date object
export const safeParseDateString = (dateString) => {
    if (!dateString) return new Date();
    
    // Try standard JS parsing first (Works on iOS/Web)
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) return parsed;
    
    // Fallback for Hermes engine (Android) parsing "MMM DD, YYYY"
    const parts = dateString.replace(',', '').split(' ');
    if (parts.length === 3) {
        const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const month = shortMonths.indexOf(parts[0]);
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        if (month !== -1 && !isNaN(day) && !isNaN(year)) {
            return new Date(year, month, day);
        }
    }
    return new Date();
};