export const TRAIL_CONSTANTS = {
    TRAIL_INFORMATION: {
        general: {
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
        },
        difficulty: {
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
            obstacles: {
                text: 'Slope obstacles (km)', 
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
            difficulty_points: {
                text: 'Difficulty points', 
                type: 'multi-select', 
                options: ['Cliff', 'River']
            },
        },
        geographical: {
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
        },
        tourism: {
            shelter: {
                text: 'Shelter', 
                type: 'boolean'
            },
            resting: {
                text: 'Resting areas', 
                type: 'boolean'
            },
            information_board: {
                text: 'Information Board', 
                type: 'boolean'
            },
            clean_water: {
                text: 'Drinking Water', 
                type: 'boolean'
            },
            river: {
                text: 'Rivers', 
                type: 'boolean'
            },
            lake: {
                text: 'Lakes', 
                type: 'boolean'
            },
            waterfall: {
                text: 'Waterfalls', 
                type: 'boolean'
            },
            monument: {
                text: 'Monuments', 
                type: 'boolean'
            },
            community: {
                text: 'Communities', 
                type: 'boolean'
            },
            viewpoint: {
                text: 'Viewpoints', 
                type: 'multi-select', 
                options: ['V1', 'V2', 'V3']
            },
        },
    }
}