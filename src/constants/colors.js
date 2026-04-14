export const Colors = {
    // Brand & Backgrounds
    PRIMARY:          Palette.Green700, 
    SECONDARY:        Palette.Green400,
    BACKGROUND:       Palette.OffWhite,

    // Core Neutrals
    BLACK:            Palette.Neutral900,
    WHITE:            Palette.White,
    GRAY:             Palette.Neutral500,
    GRAY_MEDIUM:      Palette.Neutral400, 
    GRAY_LIGHT:       Palette.Neutral200,
    GRAY_ULTRALIGHT:  Palette.Neutral100,
    
    // Typography
    TEXT_PRIMARY:     Palette.Neutral950, 
    TEXT_SECONDARY:   Palette.Neutral500, 
    TEXT_INVERSE:     Palette.White, 
    TEXT_PLACEHOLDER: Palette.Neutral400,

    // UI Elements
    YELLOW:           Palette.Yellow600,
    SHADOW:           Palette.TrueBlack,
    MODAL_OVERLAY:    Palette.BlackAlpha50,
    SEARCH_BAR_BG:    Palette.GrayAlpha25,

    // Base Statuses
    ERROR:            Palette.Red700,
    ERROR_BG:         Palette.Red50,
    ERROR_BORDER:     Palette.Red100,
    SUCCESS:          Palette.Green700,
    WARNING:          Palette.Red700,  

    // Password/Action Strength
    STRENGTH_EMPTY:   Palette.Neutral50,
    STRENGTH_WEAK:    Palette.Red700,
    STRENGTH_MEDIUM:  Palette.Amber500,
    STRENGTH_STRONG:  Palette.Green700,

    // Interactive Chips
    CHIP_INACTIVE:    Palette.Neutral100, 
    CHIP_ACTIVE:      Palette.Green700,

    // Admin/Document Statuses
    STATUS_APPROVED_BG:     Palette.Green50,
    STATUS_APPROVED_TEXT:   Palette.Green700,
    STATUS_APPROVED_BORDER: Palette.Green100,
    
    STATUS_PENDING_BG:      Palette.Blue50,
    STATUS_PENDING_TEXT:    Palette.Blue600,
    STATUS_PENDING_BORDER:  Palette.Blue100,

    STATUS_WARNING_BG:      Palette.Yellow50,
    STATUS_WARNING_TEXT:    Palette.Yellow700,
    STATUS_WARNING_BORDER:  Palette.Yellow100,
    
    STATUS_CANCELLED_BG:    Palette.Red50,
    STATUS_CANCELLED_TEXT:  Palette.Red700,
    STATUS_CANCELLED_BORDER:Palette.Red100,

    // Weather
    WEATHER_SAFE_BG:        Palette.Green700,
    WEATHER_SAFE_TEXT:      Palette.White,
    
    WEATHER_CAUTION_BG:     Palette.Yellow600, 
    WEATHER_CAUTION_TEXT:   Palette.TrueBlack,
    
    WEATHER_DANGER_BG:      Palette.Red700,
    WEATHER_DANGER_TEXT:    Palette.White,
};

export const Palette = {
    // Neutrals
    TrueBlack:  '#000000',
    Neutral950: '#040906',
    Neutral900: '#111827',
    Neutral500: '#686868',
    Neutral400: '#A2A2A2',
    Neutral200: '#D9D9D9',
    Neutral100: '#F5F5F5',
    Neutral50:  '#E5E7EB',
    White:      '#FFFFFF',
    OffWhite:   '#FAFCFA',

    // Greens
    Green700:   '#2E7D32',
    Green400:   '#7DBC81',
    Green100:   '#C8E6C9',
    Green50:    '#E8F5E9',
    
    // Reds
    Red700:     '#D32F2F',
    Red100:     '#FFCDD2',
    Red50:      '#FFEBEE',
    
    // Blues
    Blue600:    '#1976D2',
    Blue100:    '#BBDEFB',
    Blue50:     '#E3F2FD',

// Yellows & Ambers
    Yellow700:  '#F57F17',
    Yellow600:  '#FBC02D',
    Yellow100:  '#FFF9C4',
    Yellow50:   '#FFFDE7',
    Amber500:   '#F59E0B',

    // Transparencies
    BlackAlpha50: 'rgba(0, 0, 0, 0.5)',
    GrayAlpha25:  '#C4C4C440',
};

// Color Samples
// Prototype
// export const Colors = {
//     BLACK:          '#111827',
//     WHITE:          '#FFFFFF',
//     GRAY:           '#686868',
//     GRAY_MEDIUM:    '#A2A2A2', 
//     GRAY_LIGHT:     '#D9D9D9',
//     GRAY_ULTRALIGHT:'#F5F5F5',
    
//     PRIMARY:        '#A2A2A2', 
//     SECONDARY:      '#D9D9D9', 
//     BACKGROUND:     '#FAFAFA',
    
//     TEXT_PRIMARY:   '#040906', 
//     TEXT_SECONDARY: '#686868', 
//     TEXT_INVERSE:   '#FFFFFF', 
//     TEXT_PLACEHOLDER:'#A2A2A2',

//     YELLOW:         '#FBC02D',
//     SHADOW:         '#000000',
//     MODAL_OVERLAY:  'rgba(0, 0, 0, 0.5)',

//     ERROR:          '#D32F2F',
//     ERROR_BG:       '#FFEBEE',
//     ERROR_BORDER:   '#FFCDD2',
//     SUCCESS:        '#388E3C',
//     WARNING:        '#D32F2F',   

//     SEARCH_BAR_BG:  '#C4C4C440',
//     CHIP_INACTIVE:  '#C4C4C440', 
//     CHIP_ACTIVE:    '#A0A0A0',
// };

    // BLACK:          '#111827',
    // WHITE:          '#FFFFFF',
    // GRAY:           '#686868',
    // GRAY_MEDIUM:    '#A2A2A2', 
    // GRAY_LIGHT:     '#D9D9D9',
    // GRAY_ULTRALIGHT:'#F5F5F5',

    // PRIMARY:        '#E2F0BD',
    // SECONDARY:      '#8DB654',
    // BACKGROUND:     '#FAFAFA',

    // TEXT_PRIMARY:   '#040906',
    // TEXT_SECONDARY: '#686868',
    // TEXT_INVERSE:   '#FFFFFF',
    // TEXT_PLACEHOLDER:'#A2A2A2',

    // YELLOW:         '#FBC02D',
    // SHADOW:         '#000000',
    // MODAL_OVERLAY:  'rgba(0, 0, 0, 0.5)',

    // ERROR:          '#D32F2F',
    // ERROR_BG:       '#FFEBEE',
    // ERROR_BORDER:   '#FFCDD2',
    // SUCCESS:        '#388E3C',
    // WARNING:        '#D32F2F',   

    // SEARCH_BAR_BG:  '#EBEBE8',
    // CHIP_INACTIVE:  '#C4C4C440', 
    // CHIP_ACTIVE:    '#8DB654',



// Sample 1 = {
//     BLACK:          '#0F2815', 
//     WHITE:          '#FFFFFF',
//     Gray:           '#607D66',
//     GRAY_MEDIUM:    '#A5B6A8', 
//     GRAY_LIGHT:     '#E8F5E9', 

//     PRIMARY:        '#2E7D32', 
//     SECONDARY:      '#81C784',
//     BACKGROUND:     '#FAFCFA', 

//     // Utilities
//     ERROR:          '#D32F2F',
//     ERROR_BG:       '#FFEBEE',
//     ERROR_BORDER:   '#FFCDD2',
//     SUCCESS:        '#388E3C',
//     WARNING:        '#FBC02D',
//     MODAL_OVERLAY:  'rgba(15, 40, 21, 0.5)',
// }

// Sample 2 = {
//     BLACK:          '#121212',
//     WHITE:          '#FFFFFF',
//     Gray:           '#757575',
//     GRAY_MEDIUM:    '#BDBDBD', 
//     GRAY_LIGHT:     '#EEEEEE',

//     PRIMARY:        '#009688',
//     SECONDARY:      '#263238',
//     BACKGROUND:     '#F4F4F4',

//     ERROR:          '#D32F2F',
//     ERROR_BG:       '#FFEBEE',
//     ERROR_BORDER:   '#FFCDD2',
//     SUCCESS:        '#00C853',
//     WARNING:        '#FFAB00',
//     MODAL_OVERLAY:  'rgba(0, 0, 0, 0.6)',
// }

// Sample 3 = {
//     BLACK:          '#121212',
//     WHITE:          '#FFFFFF',
//     Gray:           '#757575',
//     GRAY_MEDIUM:    '#BDBDBD', 
//     GRAY_LIGHT:     '#EEEEEE',

//     PRIMARY:        '#013F4A',
//     SECONDARY:      '#068562',
//     BACKGROUND:     '#FAFAFA',

//     ERROR:          '#D32F2F',
//     ERROR_BG:       '#FFEBEE',
//     ERROR_BORDER:   '#FFCDD2',
//     SUCCESS:        '#00C853',
//     WARNING:        '#FFAB00',
//     MODAL_OVERLAY:  'rgba(0, 0, 0, 0.6)',
// }