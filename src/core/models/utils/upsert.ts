export const upsertItem = <T extends { id: string }>(array: T[], item: T): T[] => {
    const index = array.findIndex((i) => i.id === item.id);
    const updatedArray = [...array];
    
    if (index > -1) {
        updatedArray[index] = item;
    } else {
        updatedArray.push(item);
    }
    return updatedArray;
}