import { IFormField } from "@/src/core/interface/formFieldInterface";
import { Application } from "@/src/core/models/Application/Application";

export interface IApplicationFormField extends IFormField<keyof Application | 'root'> {}


export const ApplicationUIConfig: IApplicationFormField[] = [
    {
        section: 'root',
        id: 'name',
        label: 'Business Name',
        type: 'text',
        required: true,
    },
    {
        section: 'root',
        id: 'establishedOn',
        label: 'Date of Establishment',
        type: 'date',
        required: true,
    },
    {
        section: 'root',
        id: 'address',
        label: 'Owner/Office Address',
        type: 'text',
        required: true,
    },
    {
        section: 'root',
        id: 'servicedLocation',
        label: 'Offered Locations',
        type: 'multi-select',
        options: 'provinces',
        required: true,
    },
    {
        section: 'owner',
        id: 'name',
        label: 'Name',
        type: 'text',
        required: true,
    },
    {
        section: 'owner',
        id: 'email',
        label: 'Email',
        type: 'text',
        required: true,
    },
    {
        section: 'owner',
        id: 'validId',
        label: 'Valid Government ID',
        type: 'text',
        required: true,
    },
    {
        section: 'permits',
        id: 'bir',
        label: 'BIR',
        type: 'file',
        required: true,
    },
    {
        section: 'permits',
        id: 'dti',
        label: 'DTI',
        type: 'file',
        required: true,
    },
    {
        section: 'permits',
        id: 'denr',
        label: 'DENR',
        type: 'file',
        required: true,
    },

]

export const APPLICATION_INFO = {
    business: {
        businessName: {
            text: 'Business Name',
            type: 'text',
            required: true,
        },
        businessAddress: {
            text: 'Office Address',
            type: 'text',
            required: true,
        },
        establishedOn: {
            text: 'Established on',
            type: 'date',
            required: true,
        },
        servicedLocation: {
            text: 'Offered Locations',
            type: 'multi-select',
            options: 'provinces',
            required: true,
        }
    },
    applicant: {
        validId: {
            text: 'Owner\'s Valid ID',
            type: 'file',
            required: true,
        },
    },
    permits: {
        denr: {
            text: 'DENR Permit',
            type: 'file',
            required: false,
        },
        dti: {
            text: 'DTI',
            type: 'file',
            required: false,
        },
        bir: {
            text: 'BIR',
            type: 'file',
            required: false,
        },
    }
}