import { Trail } from "@/src/core/models/Trail/Trail";
import { IFormField } from "../core/interface/formFieldInterface";

export interface ITrailFormField extends IFormField<keyof Trail> {
    placeholder?: string;
    helperText?: string;
}

export const TrailUIConfig: ITrailFormField[] = [
    // --- GENERAL --- 
    {
        section: 'general', 
        id: 'name', 
        label: 'Trail Name', 
        type: 'text', 
        placeholder: 'e.g. Mt. Batulao',
        required: true 
    },
    { 
        section: 'general', 
        id: 'address', 
        label: 'Address', 
        type: 'text', 
        placeholder: 'e.g. Nasugbu, Batangas',
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
        placeholder: 'Enter trail description, terrain details, and highlights...',
        required: false
    },
    {
        section: 'general',
        id: 'active',
        label: 'Active Status',
        type: 'boolean',
        required: true
    },
    {
        section: 'general',
        id: 'critical_info',
        label: 'Critical Trail Update',
        type: 'text',
        placeholder: 'Enter urgent safety or trail advisory...',
        required: false
    },
    {
        section: 'general',
        id: 'guidelines',
        label: 'Rules of the Trail',
        type: 'text',
        required: true
    },
    {
        section: 'general',
        id: 'safety_tips',
        label: 'Keep Safe Tips',
        type: 'text',
        required: false
    },
    {
        section: 'general',
        id: 'lgu_rules',
        label: 'LGU Ordinances',
        type: 'text',
        required: false
    },
    

    // --- GEOGRAPHY ---
    { 
        section: 'geography', 
        id: 'masl', 
        label: 'MASL (Meters)', 
        type: 'numerical', 
        placeholder: 'e.g. 811',
        required: true 
    },
    { 
        section: 'geography', 
        id: 'startLat', 
        label: 'Start Latitude', 
        type: 'numerical', 
        placeholder: 'e.g. 14.0412',
        required: true 
    },
    { 
        section: 'geography', 
        id: 'startLong', 
        label: 'Start Longitude', 
        type: 'numerical', 
        placeholder: 'e.g. 120.8015',
        required: true 
    },
    { 
        section: 'geography', 
        id: 'endLat', 
        label: 'End Latitude', 
        type: 'numerical', 
        placeholder: 'e.g. 14.0485',
        required: true 
    },
    { 
        section: 'geography', 
        id: 'endLong', 
        label: 'End Longitude', 
        type: 'numerical', 
        placeholder: 'e.g. 120.8112',
        required: true 
    },

    // --- DIFFICULTY ---
    {
        section: 'difficulty',
        id: 'classification',
        label: 'Classification',
        type: 'single-select',
        options: 'classification',
        required: true
    },
    {
        section: 'difficulty',
        id: 'lascoRating',
        label: 'LASCO Rating (1-9)',
        type: 'numerical',
        placeholder: '1 - 9 (e.g. 4)',
        required: true
    },
    {
        section: 'description',
        id: 'lascoRatingDescription',
        label: 'Difficulty Description',
        type: 'text',
        placeholder: 'Explain terrain challenges, steepness, or why this trail received this rating...',
        required: false
    },
    { 
        section: 'difficulty', 
        id: 'length', 
        label: 'Length (km)', 
        type: 'numerical', 
        placeholder: 'e.g. 5.5',
        required: true 
    },
    { 
        section: 'difficulty', 
        id: 'gain', 
        label: 'Elevation Gain (m)', 
        type: 'numerical', 
        placeholder: 'e.g. 350',
        required: true 
    },
    { 
        section: 'difficulty', 
        id: 'slope', 
        label: 'Slope (%)', 
        type: 'numerical', 
        placeholder: 'e.g. 15',
        required: true 
    },
    { 
        section: 'difficulty', 
        id: 'obstacles', 
        label: 'Obstacles (m)', 
        type: 'numerical', 
        placeholder: 'e.g. 0',
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