export const TRAIL_INFORMATION = {
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
            options: 'provinces',
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
        masl: {
            text: 'MASL', 
            type: 'numerical',
            required: true,
        },
        startLat: {
            text: 'Start (lat)', 
            type: 'numerical',
            required: true,
        },
        startLong: {
            text: 'Start (long)', 
            type: 'numerical',
            required: true,
        },
        endLat: {
            text: 'End (lat)', 
            type: 'numerical',
            required: true,
        },
        endLong: {
            text: 'End (long)', 
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
            options: 'circularity',
            required: true,
        },
        quality: {
            text: 'Trail Quality', 
            type: 'multi-select', 
            options: 'quality',
            required: true,
        },
        difficulty_points: {
            text: 'Difficulty points', 
            type: 'multi-select', 
            options: 'difficulty_points',
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
            options: 'viewpoints',
            required: false,
        },
    }
}