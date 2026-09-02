export const formatTime = (ms: number) => {
    if (ms === 0) return '--';
    const totalMins = Math.floor(ms / 60000);
    if (totalMins < 1) return '< 1m';
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

export const formatDistance = (m: number) => {
    if (m === 0) return '--';
    return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;
};