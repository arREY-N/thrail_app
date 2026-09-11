import { FieldValue, Timestamp } from "firebase/firestore";

interface TimestampLike {
    toDate: () => Date;
}

interface SecondsLike {
    seconds: number;
}

const isTimestampLike = (val: unknown): val is TimestampLike => {
    return typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as TimestampLike).toDate === 'function';
};

const isSecondsLike = (val: unknown): val is SecondsLike => {
    return typeof val === 'object' && val !== null && 'seconds' in val && typeof (val as SecondsLike).seconds === 'number';
};

export const timestampToISO = (ts: Timestamp | FieldValue | Date | undefined | null): string => {
    if (ts && isTimestampLike(ts)) {
        return ts.toDate().toISOString().split('T')[0];
    }
    if (ts instanceof Date && !isNaN(ts.getTime())) {
        return ts.toISOString().split('T')[0];
    }
    return "";
};

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

export const toDate = (value: Timestamp | FieldValue | Date | string | number | unknown): Date => {
    if (!value) return new Date();
    if (value instanceof Date) return isNaN(value.getTime()) ? new Date() : value;
    if (isTimestampLike(value)) return value.toDate();
    if (isSecondsLike(value)) return new Date(value.seconds * 1000);

    const date = new Date(value as string | number);
    return isNaN(date.getTime()) ? new Date() : date;
};

export const toDateOrNull = (value: Timestamp | FieldValue | Date | string | number | unknown): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (isTimestampLike(value)) {
        const d = value.toDate();
        return isNaN(d.getTime()) ? null : d;
    }
    if (isSecondsLike(value)) {
        const d = new Date(value.seconds * 1000);
        return isNaN(d.getTime()) ? null : d;
    }

    const date = new Date(value as string | number);
    return isNaN(date.getTime()) ? null : date;
};

export const formatSunTime = (isoString: string): string => {
    // Open-Meteo returns time in Asia/Manila, we parse directly without timezone offset translations.
    if (!isoString) return "--";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "--";
    
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        // Optional depending on your environment, but standard date parser of "YYYY-MM-DDTHH:mm"
        // assumes local time. Since it's already Asia/Manila, it will format correctly locally.
    });
};