import { Property } from "@/src/types/Property";

export interface BaseStore<T>{
    data: T[];
    current: T | null;
    isLoading: boolean;
    error: string | null;

    fetchAll: () => Promise<void>;
    refresh: () => Promise<void>;
    load: (...args: any) => Promise<void>;
    create: (...args: any) => Promise<Boolean>;
    delete: (id: string) => Promise<void>;
    edit: (property: Property) => void;
    reset: () => void;
}

export abstract class Store<T> implements BaseStore<T>{
    data: T[];
    current: T | null;
    isLoading: boolean;
    error: string | null;
    
    constructor(){
        this.data = [];
        this.current = null;
        this.isLoading = true;
        this.error = null;
    }
    
    abstract fetchAll(): Promise<void>;
    abstract refresh(): Promise<void>;
    abstract load(...args: any[]): Promise<void>;
    abstract create(...args: any[]): Promise<Boolean>;
    abstract delete(...args: any[]): Promise<void>;
    abstract edit(property: Property): void;
    abstract reset(): void;
}