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