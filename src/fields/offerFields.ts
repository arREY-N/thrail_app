export const OFFER_INFORMATION = {
    hikeDate: {
        text: 'Date',
        type: 'date'
    },
    price: {
        text: 'Price',
        type: 'numerical',
    },
    description: {
        text: 'Description',
        type: 'text',
    },
    documents: {
        text: 'Document',
        type: 'multi-select',
        options: 'offerDocuments'
    },
    trail: {
        text: 'Trail', 
        type: 'object-select',
        options: 'trails',
        key: 'name'
    },
    hikeDuration: {
        text: 'Duration',
        type: 'single-select',
        options: 'hikeDuration'
    },
    inclusions: {
        text: 'Inclusions',
        type: 'multi-select',
        options: 'offerInclusions'
    },
}