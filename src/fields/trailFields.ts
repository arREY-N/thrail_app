import { Trail } from "@/src/core/models/Trail/Trail";
import { IFormField } from "../core/interface/formFieldInterface";

export interface ITrailFormField extends IFormField<keyof Trail> {}

export const TrailUIConfig: ITrailFormField[] = [
    // --- GENERAL --- 
    {
        section: 'general', 
        id: 'name', 
        label: 'Trail Name', 
        type: 'text', 
        required: true 
    },
    { 
        section: 'general', 
        id: 'address', 
        label: 'Address', 
        type: 'text', 
        required: true 
    },
    { 
        section: 'general', 
        id: 'province', 
        label: 'Province', 
        type: 'multi-select', 
        options: 'provinces', 
        required: true 
    },
    { 
        section: 'general', 
        id: 'mountain', 
        label: 'Mountain', 
        type: 'multi-select', 
        options: 'mountains', 
        required: true 
    },

    // --- GEOGRAPHY ---
    { 
        section: 'geography', 
        id: 'masl', 
        label: 'MASL (Meters)', 
        type: 'numerical', 
        required: true 
    },
    { 
        section: 'geography', 
        id: 'startLat', 
        label: 'Start Latitude', 
        type: 'numerical', 
        required: true 
    },
    { 
        section: 'geography', 
        id: 'startLong', 
        label: 'Start Longitude', 
        type: 'numerical', 
        required: true 
    },
    { 
        section: 'geography', 
        id: 'endLat', 
        label: 'End Latitude', 
        type: 'numerical', 
        required: true 
    },
    { 
        section: 'geography', 
        id: 'endLong', 
        label: 'End Longitude', 
        type: 'numerical', 
        required: true 
    },

    // --- DIFFICULTY ---
    { 
        section: 'difficulty', 
        id: 'length', 
        label: 'Length (km)', 
        type: 'numerical', 
        required: true 
    },
    { 
        section: 'difficulty', 
        id: 'gain', 
        label: 'Elevation Gain (m)', 
        type: 'numerical', 
        required: true 
    },
    { 
        section: 'difficulty', 
        id: 'slope', 
        label: 'Slope (%)', 
        type: 'numerical', 
        required: true 
    },
    { 
        section: 'difficulty', 
        id: 'obstacles', 
        label: 'Obstacles (m)', 
        type: 'numerical', 
        required: true 
    },
    { 
        section: 'difficulty', 
        id: 'hours', 
        label: 'Est. Hours', 
        type: 'numerical', 
        required: true 
    },
    { 
        section: 'difficulty', 
        id: 'circularity', 
        label: 'Circularity', 
        type: 'single-select', 
        options: 'circularity', 
        required: true 
    },
    { 
        section: 'difficulty', 
        id: 'quality', 
        label: 'Trail Quality', 
        type: 'multi-select', 
        options: 'quality', 
        required: true 
    },
    { 
        section: 'difficulty', 
        id: 'difficulty_points', 
        label: 'Difficulty Points', 
        type: 'multi-select', 
        options: 'difficultyPoints', 
        required: false 
    },

    // --- TOURISM ---
    { 
        section: 'tourism', 
        id: 'shelter', 
        label: 'Shelter Available', 
        type: 'boolean', 
        required: false 
    },
    { 
        section: 'tourism', 
        id: 'resting', 
        label: 'Resting Areas', 
        type: 'boolean', 
        required: false 
    },
    { 
        section: 'tourism', 
        id: 'information_board', 
        label: 'Info Boards', 
        type: 'boolean', 
        required: false 
    },
    { 
        section: 'tourism', 
        id: 'clean_water', 
        label: 'Drinking Water', 
        type: 'boolean', 
        required: false 
    },
    { 
        section: 'tourism', 
        id: 'river', 
        label: 'Rivers', 
        type: 'boolean', 
        required: false 
    },
    { 
        section: 'tourism', 
        id: 'lake', 
        label: 'Lakes', 
        type: 'boolean', 
        required: false 
    },
    { 
        section: 'tourism', 
        id: 'waterfall', 
        label: 'Waterfalls', 
        type: 'boolean', 
        required: false 
    },
    { 
        section: 'tourism', 
        id: 'monument', 
        label: 'Monuments', 
        type: 'boolean', 
        required: false 
    },
    { 
        section: 'tourism', 
        id: 'community', 
        label: 'Local Communities', 
        type: 'boolean', 
        required: false 
    },
    { 
        section: 'tourism', 
        id: 'viewpoint', 
        label: 'Viewpoints', 
        type: 'multi-select', 
        options: 'viewpoints', 
        required: false 
    }
];
// export const TRAIL_INFORMATION = {
//     general: {
//         name: {
//             text: 'Name', 
//             type: 'text',
//             required: true,
//         },
//         address: {
//             text: 'Address', 
//             type: 'text',
//             required: true,
//         },
//         province: {
//             text: 'Province', 
//             type: 'multi-select', 
//             options: 'provinces',
//             required: true,
//         },
//         mountain: {
//             text: 'Mountain',
//             type: 'object-select',
//             options: 'mountains',
//             key: 'name',
//             required: true,
//         }
//     },
//     geography: {
//         masl: {
//             text: 'MASL', 
//             type: 'numerical',
//             required: true,
//         },
//         startLat: {
//             text: 'Start (lat)', 
//             type: 'numerical',
//             required: true,
//         },
//         startLong: {
//             text: 'Start (long)', 
//             type: 'numerical',
//             required: true,
//         },
//         endLat: {
//             text: 'End (lat)', 
//             type: 'numerical',
//             required: true,
//         },
//         endLong: {
//             text: 'End (long)', 
//             type: 'numerical',
//             required: true,
//         },
//     },
//     difficulty: {
//         length: {
//             text: 'Length (km)', 
//             type: 'numerical',
//             required: true,
//         },
//         gain: {
//             text: 'Elevation Gain (km)', 
//             type: 'numerical',
//             required: true,
//         },
//         slope: {
//             text: 'Slope (%)', 
//             type: 'numerical',
//             required: true,
//         },
//         obstacles: {
//             text: 'Slope obstacles (km)', 
//             type: 'numerical',
//             required: true,
//         },
//         hours: {
//             text: 'Hours to summit (hr)', 
//             type: 'numerical',
//             required: true,
//         },
//         circularity: {
//             text: 'Trail Circularity', 
//             type: 'single-select', 
//             options: 'circularity',
//             required: true,
//         },
//         quality: {
//             text: 'Trail Quality', 
//             type: 'multi-select', 
//             options: 'quality',
//             required: true,
//         },
//         difficulty_points: {
//             text: 'Difficulty points', 
//             type: 'multi-select', 
//             options: 'difficulty_points',
//             required: false,
//         },
//     },
//     tourism: {
//         shelter: {
//             text: 'Shelter', 
//             type: 'boolean',
//             required: false,
//         },
//         resting: {
//             text: 'Resting areas', 
//             type: 'boolean',
//             required: false,
//         },
//         information_board: {
//             text: 'Information Board', 
//             type: 'boolean',
//             required: false,
//         },
//         clean_water: {
//             text: 'Drinking Water', 
//             type: 'boolean',
//             required: false,
//         },
//         river: {
//             text: 'Rivers', 
//             type: 'boolean',
//             required: false,
//         },
//         lake: {
//             text: 'Lakes', 
//             type: 'boolean',
//             required: false,
//         },
//         waterfall: {
//             text: 'Waterfalls', 
//             type: 'boolean',
//             required: false,
//         },
//         monument: {
//             text: 'Monuments', 
//             type: 'boolean',
//             required: false,
//         },
//         community: {
//             text: 'Communities', 
//             type: 'boolean',
//             required: false,
//         },
//         viewpoint: {
//             text: 'Viewpoints', 
//             type: 'multi-select', 
//             options: 'viewpoints',
//             required: false,
//         },
//     }
// }