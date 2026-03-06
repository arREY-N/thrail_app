import { IFormField } from "@/src/core/interface/formFieldInterface";
import { Mountain } from "@/src/core/models/Mountain/Mountain";

export interface IMountainFormField extends IFormField<keyof Mountain | 'root'>{}

export const MountainUIConfig: IMountainFormField[] = [
    {
        section: 'root',
        id: 'name',
        label: 'Name',
        type: 'text',
        required: true,
    },
    {
        section: 'root',
        id: 'province',
        label: "Province",
        type: "multi-select",
        options: 'provinces',
        required: true,
    }
]