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
    {
        section: 'general',
        id: 'description',
        label: 'Description',
        type: 'text',
        required: false
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