import { TEdit } from "@/src/core/interface/domainHookInterface";
import { IFormField } from "@/src/core/interface/formFieldInterface";

// TODO create a utility function to edit object values

export interface ISetFinalValue<T extends IFormField<T>> extends TEdit{
    objects?: object[];
    fieldConfig: IFormField<T>;
    option?: string;
    draft: T;
}

export default function setFinalValue<T extends IFormField<T>>(params: ISetFinalValue<T>){
    const { objects, fieldConfig, section, id, value, option, draft } = params;

    if (fieldConfig?.type === 'object-select' && fieldConfig.options === 'mountains') {
        if(!option) return null;
        const found = (objects as any)[option].find((m: any) => m.name === value);
        return found ? found.name : value;
    } else if (fieldConfig?.type === 'multi-select') {
        const current: [] = section === 'root'
            ? (draft as any)[id]
            : (draft as any)[section][id]

        return current.find(c => c === value)
            ? current.filter(c => c !== value)
            : [...current, value]
    } else if (fieldConfig?.type === 'boolean') {
        const current: boolean = section === 'root'
            ? (draft as any)[id]
            : (draft as any)[section][id]

        return current === null
            ? true
            : !current;
    } else if (fieldConfig?.type === 'single-select') {
        const current: string = section === 'root'
            ? (draft as any)[id]
            : (draft as any)[section][id]

        return current === value 
            ? ''
            : value
    }   

    return value;
}