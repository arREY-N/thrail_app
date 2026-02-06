export const TRAIL_CONSTANTS = {
    TRAIL_INFORMATION: {
        general: {
            name: {
                text: 'Name', 
                type: 'text',
                required: true,
            },
            address: {
                text: 'Address', 
                type: 'text',
                required: true,
            },
            province: {
                text: 'Province', 
                type: 'multi-select', 
                options: ['Cavite', 'Laguna', 'Batangas', 'Rizal', 'Quezon'],
                required: true,
            },
            mountain: {
                text: 'Mountain',
                type: 'object-select',
                options: 'mountains',
                key: 'name',
                required: true,
            }
        },
        geography: {
            longitude: {
                text: 'Longitude', 
                type: 'numerical',
                required: true,
            },
            latitude: {
                text: 'Latitude', 
                type: 'numerical',
                required: true,
            },
            masl: {
                text: 'MASL', 
                type: 'numerical',
                required: true,
            },
            start: {
                text: 'Start', 
                type: 'numerical',
                required: true,
            },
            end: {
                text: 'End', 
                type: 'numerical',
                required: true,
            },
        },
        difficulty: {
            length: {
                text: 'Length (km)', 
                type: 'numerical',
                required: true,
            },
            gain: {
                text: 'Elevation Gain (km)', 
                type: 'numerical',
                required: true,
            },
            slope: {
                text: 'Slope (%)', 
                type: 'numerical',
                required: true,
            },
            obstacles: {
                text: 'Slope obstacles (km)', 
                type: 'numerical',
                required: true,
            },
            hours: {
                text: 'Hours to summit (hr)', 
                type: 'numerical',
                required: true,
            },
            circularity: {
                text: 'Trail Circularity', 
                type: 'single-select', 
                options: ['Circular', 'Out-and-Back', 'Traverse'],
                required: true,
            },
            quality: {
                text: 'Trail Quality', 
                type: 'multi-select', 
                options: ['Q1', 'Q2', 'Q3'],
                required: true,
            },
            difficulty_points: {
                text: 'Difficulty points', 
                type: 'multi-select', 
                options: ['Cliff', 'River'],
                required: false,
            },
        },
        tourism: {
            shelter: {
                text: 'Shelter', 
                type: 'boolean',
                required: false,
            },
            resting: {
                text: 'Resting areas', 
                type: 'boolean',
                required: false,
            },
            information_board: {
                text: 'Information Board', 
                type: 'boolean',
                required: false,
            },
            clean_water: {
                text: 'Drinking Water', 
                type: 'boolean',
                required: false,
            },
            river: {
                text: 'Rivers', 
                type: 'boolean',
                required: false,
            },
            lake: {
                text: 'Lakes', 
                type: 'boolean',
                required: false,
            },
            waterfall: {
                text: 'Waterfalls', 
                type: 'boolean',
                required: false,
            },
            monument: {
                text: 'Monuments', 
                type: 'boolean',
                required: false,
            },
            community: {
                text: 'Communities', 
                type: 'boolean',
                required: false,
            },
            viewpoint: {
                text: 'Viewpoints', 
                type: 'multi-select', 
                options: ['V1', 'V2', 'V3'],
                required: false,
            },

        }
    },
    REQUIRED_INFO: {
        name: {
            text: 'Name', 
            type: 'text'
        },
        address: {
            text: 'Address', 
            type: 'text'
        },
        province: {
            text: 'Province', 
            type: 'multi-select', 
            options: ['Cavite', 'Laguna', 'Batangas', 'Rizal', 'Quezon']
        },       
        longitude: {
            text: 'Longitude', 
            type: 'numerical'
        },
        latitude: {
            text: 'Latitude', 
            type: 'numerical'
        },
        masl: {
            text: 'MASL', 
            type: 'numerical'
        },
        start: {
            text: 'Start', 
            type: 'numerical'
        },
        end: {
            text: 'End', 
            type: 'numerical'
        },
        length: {
            text: 'Length (km)', 
            type: 'numerical'
        },
        gain: {
            text: 'Elevation Gain (km)', 
            type: 'numerical'
        },
        slope: {
            text: 'Slope (%)', 
            type: 'numerical'
        },
        hours: {
            text: 'Hours to summit (hr)', 
            type: 'numerical'
        },
        circularity: {
            text: 'Trail Circularity', 
            type: 'single-select', 
            options: ['Circular', 'Out-and-Back', 'Traverse']
        },
        quality: {
            text: 'Trail Quality', 
            type: 'multi-select', 
            options: ['Q1', 'Q2', 'Q3']
        },
    }
}