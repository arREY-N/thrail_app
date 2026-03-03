export interface IFormField {
    section: 'general' | 'geography' | 'difficulty' | 'tourism' | 'root';
    id: string;
    label: string;
    type: 'text' | 'numerical' | 'boolean' | 'single-select' | 'multi-select' | 'object-select' | 'file';
    required: boolean;
    options?: string;
    key?: string;
}