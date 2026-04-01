export const formatBookingDate = (dateObj, shortMonth = false) => {
    if (!dateObj) return 'TBA';
    
    let d = dateObj;
    if (typeof dateObj.toDate === 'function') d = dateObj.toDate();
    else if (dateObj.seconds) d = new Date(dateObj.seconds * 1000);
    else if (!(dateObj instanceof Date)) d = new Date(dateObj);

    if (isNaN(d.getTime())) return 'Invalid Date';

    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const months = shortMonth ? shortMonths : fullMonths;
    
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} • ${hours}:${minutes} ${ampm}`;
};