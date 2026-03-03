export type FieldType = 'text' | 'numerical' | 'single-select' | 'multi-select' | 'object-select' | 'boolean'

export interface FieldConfig{
    text: string;
    type: FieldType;
    required: boolean;
    options?: string;
    key?: string;
}

export interface Property{
    key: string;
    type: FieldType;
    value: any;
}