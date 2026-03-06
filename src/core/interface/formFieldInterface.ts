export interface IFormField<T> {
    section: T;
    id: string;
    label: string;
    type: 'text' | 'numerical' | 'boolean' | 'single-select' | 'multi-select' | 'object-select' | 'file' | 'date';
    required: boolean;
    options?: string;
    key?: string;
}