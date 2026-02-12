export const APPLICATION_INFO = {
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