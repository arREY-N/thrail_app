import { Property } from "@/src/types/Property";

export const editProperty = <T>(currentData: T, property: Property): T => {
    const { type, key, value } = property;

    let current = (currentData as any)[key];
    let finalValue = value;
    
    if(type === 'multi-select'){
        const list = Array.isArray(current) ? current : [];
        finalValue = list?.find(v => v === value)
            ? current.filter((c: any) => c !== value)
            : [...current, value]
    } else if (type ===  'boolean'){
        finalValue = !current
    } 

    return {
        ...currentData,
        [key]: finalValue
    }
}