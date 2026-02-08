import { OPTIONS } from "./constants";

export const APPLICATION_CONSTANTS = {
    APPLICATION_INFO: {
        applicant: {
            applicantName: {
                text: 'Applicant Name',
                type: 'text',
                required: true,
            },
            email: {
                text: 'Email',
                type: 'text',
                required: true,
            },
            validId: {
                text: 'Valid ID',
                type: 'file',
                required: true,
            },
        },
        business: {
            businessName: {
                text: 'Business Name',
                type: 'text',
                required: true,
            },
            address: {
                text: 'Office Address',
                type: 'text',
                required: true,
            },
            establishedOn: {
                text: 'Established on',
                type: 'text',
                required: true,
            },
            servicedLocation: {
                text: 'Offered Locations',
                type: 'multi-select',
                options: OPTIONS.provinces,
                required: true,
            }
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
}