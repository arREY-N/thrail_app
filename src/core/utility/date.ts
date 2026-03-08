import { FieldValue, Timestamp } from "firebase/firestore";

export const timestampToISO = (ts: Timestamp | FieldValue | Date | undefined | null): string => {
    if(ts && typeof (ts as any).toDate === 'function'){
        return (ts as Timestamp).toDate().toISOString().split('T')[0];
    }
    return "";
}

export const formatDate = (
    date: Date | null | undefined, 
    options: 'full' | 'short' | 'time' = 'full'
): string => {
    if (!date || isNaN(date.getTime())) return 'N/A';

    const configs = {
        full: { month: 'short', day: 'numeric', year: 'numeric' },
        short: { month: '2-digit', day: '2-digit', year: '2-digit' },
        time: { hour: '2-digit', minute: '2-digit', hour12: true }
    } as const; 

    const config = configs[options];

    return new Intl.DateTimeFormat('en-US', config).format(date);
};

export const toDate = (value: Timestamp | FieldValue | any ) : Date => {
    if(value instanceof Timestamp) return value.toDate();

    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date() : date;
}