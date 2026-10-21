import { Platform } from "react-native";

export interface TarsBatchRequest {
    cbf_engine?: 'GD' | 'ED' | 'CS' | string;
    cf_engine?: 'GD' | 'ED' | 'CS' | string;
    month_id?: string;
    commit_to_firestore?: boolean;
}

export interface TarsBatchResponse {
    status: 'success' | 'warning' | 'error';
    month: string;
    total_users_processed: number;
    total_trails_scored: number;
    alpha: number;
    samples?: Array<{
        userId: string;
        top_easy: any[];
        top_difficult: any[];
    }>;
    message?: string;
}

export const getTarsApiBaseUrl = (): string => {
    if (process.env.EXPO_PUBLIC_TARS_API_URL) {
        return process.env.EXPO_PUBLIC_TARS_API_URL.replace(/\/+$/, '');
    }
    // Android emulator loops back to host via 10.0.2.2; Web / iOS uses localhost
    const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    return `http://${host}:8000`;
};

/**
 * Checks if the TARS Python recommendation server is running and reachable.
 */
export async function checkTarsHealth(): Promise<{ healthy: boolean; message: string }> {
    const baseUrl = getTarsApiBaseUrl();
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`${baseUrl}/`, {
            method: 'GET',
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            return { healthy: true, message: data.service || 'TARS Engine is online' };
        }
        return { healthy: false, message: `Server returned HTTP ${res.status}` };
    } catch (err: any) {
        return {
            healthy: false,
            message: err.name === 'AbortError'
                ? 'Connection timed out. Ensure TARS server is running on port 8000.'
                : `Cannot reach TARS server (${err.message || 'Network error'})`,
        };
    }
}

/**
 * Triggers a full recommendation batch run across all eligible users.
 */
export async function runTarsEngine(options?: TarsBatchRequest): Promise<TarsBatchResponse> {
    const baseUrl = getTarsApiBaseUrl();
    const payload = {
        cbf_engine: options?.cbf_engine || 'GD',
        cf_engine: options?.cf_engine || 'GD',
        month_id: options?.month_id || null,
        commit_to_firestore: options?.commit_to_firestore !== false,
    };

    const controller = new AbortController();
    // 60-second timeout for full batch calculation
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
        const res = await fetch(`${baseUrl}/api/admin/run-engine`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || `Server error (${res.status})`);
        }

        return data as TarsBatchResponse;
    } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            throw new Error('TARS batch execution timed out after 60 seconds.');
        }
        throw new Error(err.message || 'Failed connecting to TARS Recommendation API.');
    }
}
