export interface ValidationRule {
    required: boolean;
    text: string;
}

export interface ValidationGroup {
    [key: string]: ValidationRule;
}

export interface FullValidationStructure {
    [groupName: string]: ValidationGroup;
}

export type ValidationStucture<T> = {
    [K in keyof T]?: ValidationRule
}