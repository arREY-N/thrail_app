export const OFFER_CONSTANTS = {
    DOCUMENT_LIST: [
        'Valid ID', 
        'Medical Certificate', 
        'Waiver' 
    ],
    HIKE_DURATION: [
        '1-3 hours', 
        'Half-day', 
        'Full-day', 
        'Overnight', 
        'Multi-day'
    ],
    OFFER_INCLUSIONS: [
        'Shuttle', 
        'Tent', 
        'Bag tag'
    ],
    OFFER_INFORMATION: {
        date: {
            text: 'Date',
            type: 'text'
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
            options: ['Valid ID', 'Medical Certificate', 'Waiver']
        },
        trail: {
            text: 'Trail', 
            type: 'object-select'
        },
        duration: {
            text: 'Duration',
            type: 'single-select',
            options: ['1-3 Hours', 'Half-day', 'Full-day', 'Overnight', 'Multi-day']
        },
        inclusions: {
            text: 'Inclusions',
            type: 'multi-select',
            options: ['Shuttle', 'Tent', 'Bag Tag']
        },
    }
}