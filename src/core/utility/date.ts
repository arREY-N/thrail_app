import { FieldValue, Timestamp } from "firebase/firestore";

export const timestampToISO = (ts: Timestamp | FieldValue | Date | undefined | null): string => {
    if(ts && typeof (ts as any).toDate === 'function'){
        return (ts as Timestamp).toDate().toISOString().split('T')[0];
    }
    return "";
}

export const toDate = (value: Timestamp | FieldValue | any ) : Date => {
    if(value instanceof Timestamp) return value.toDate();

    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date() : date;
}