export interface IBaseDomainHook{
    /** Indicates if a store is currently loading or processing */
    isLoading: boolean;

    /** Shows any error encountered by the store */
    error: string | null;
}

export interface TEdit {
    section?: string;
    id: string;
    value: any;
}

export interface IBaseWriteHook<T> {
    current: T;
    edit: (property: TEdit) => Promise<void>;
    save: () => Promise<void>;
    remove: () => Promise<void>
}