export const generateChatId = (userA: string, userB: string) => {
    const sorted = [userA, userB].sort((a, b) => a.localeCompare(b));
    return `${sorted[0]}_${sorted[1]}`;
}