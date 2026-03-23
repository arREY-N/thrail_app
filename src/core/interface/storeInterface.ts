import { TEdit } from "@/src/core/interface/domainHookInterface";

export interface BaseStore<T>{
    data: T[];
    current: T | null;
    isLoading: boolean;
    error: string | null;

    fetchAll: () => Promise<void>;
    refresh: (userId?: string | null) => Promise<void>;
    load: (...args: any) => Promise<void>;
    create: (...args: any) => Promise<Boolean>;
    delete: (id: string) => Promise<void>;
    edit?: (property: TEdit<T>) => void;
    reset: () => void;
}

