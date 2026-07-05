export const Palette = {
    // Neutrals
    TrueBlack:  '#000000',
    Neutral950: '#040906',
    Neutral900: '#111827',
    Neutral500: '#686868',
    Neutral400: '#A2A2A2',
    Neutral200: '#D9D9D9',
    Neutral100: '#F5F5F5',
    Neutral75:  '#F0F0F0',
    Neutral50:  '#E5E7EB',
    Neutral25:  '#FAFAFA',
    White:      '#FFFFFF',
    OffWhite:   '#FAFCFA',

    // Greens
    Green700:   '#2E7D32',
    Green600:   '#4CAF50',
    Green400:   '#7DBC81',
    Green200:   '#A5D6A7',
    Green100:   '#C8E6C9',
    Green50:    '#E8F5E9',
    
    // Reds
    Red900:     '#B71C1C',
    Red700:     '#D32F2F',
    Red650:     '#C62828',
    Red600:     '#E53935',
    Red500:     '#F44336',
    Red400:     '#E57373',
    Red100:     '#FFCDD2',
    Red50:      '#FFEBEE',
    Red25:      '#FFF5F5',
    
    // Blues
    Blue600:    '#1976D2',
    Blue100:    '#BBDEFB',
    Blue50:     '#E3F2FD',
    Indigo400:  '#5C6BC0',
    Slate200:   '#E2E8F0',
    Slate100:   '#F1F5F9',
    Slate50:    '#F8F9FA',

    // Yellows & Ambers & Oranges
    Yellow700:  '#F57F17',
    Yellow600:  '#FBC02D',
    Yellow100:  '#FFF9C4',
    Yellow50:   '#FFFDE7',
    Yellow25:   '#FFFDF5',
    Amber500:   '#F59E0B',
    Amber100:   '#FFECB3',
    Orange800:  '#E65100',
    Orange50:   '#FFF3E0',

    // Transparencies
    BlackAlpha50: 'rgba(0, 0, 0, 0.5)',
    WhiteAlpha90: 'rgba(255, 255, 255, 0.9)',
    WhiteAlpha80: 'rgba(255, 255, 255, 0.8)',
    WhiteAlpha70: 'rgba(255, 255, 255, 0.7)',
    WhiteAlpha0:  'rgba(255, 255, 255, 0)',
    GrayAlpha25:  '#C4C4C440',
};

export const Colors = {
    // Brand & Backgrounds
    PRIMARY:          Palette.Green700, 
    SECONDARY:        Palette.Green400,
    BACKGROUND:       Palette.OffWhite,

    // Core Neutrals
    BLACK:            Palette.Neutral900,
    WHITE:            Palette.White,
    WHITE_TRANSPARENT:Palette.WhiteAlpha0,
    GRAY:             Palette.Neutral500,
    GRAY_MEDIUM:      Palette.Neutral400, 
    GRAY_LIGHT:       Palette.Neutral200,
    GRAY_ULTRALIGHT:  Palette.Neutral100,
    
    // Typography
    TEXT_PRIMARY:     Palette.Neutral950, 
    TEXT_SECONDARY:   Palette.Neutral500, 
    TEXT_INVERSE:     Palette.White, 
    TEXT_PLACEHOLDER: Palette.Neutral400,
    
    // Button Colors
    BUTTON_PRIMARY_TEXT:     Palette.White,
    BUTTON_PRIMARY_BG:       Palette.Green700,
    BUTTON_PRIMARY_BORDER:   Palette.Green700,
    BUTTON_SECONDARY_TEXT:   Palette.Neutral900,
    BUTTON_SECONDARY_BG:     Palette.White,
    BUTTON_SECONDARY_BORDER: Palette.White,
    BUTTON_OUTLINE_TEXT:     Palette.Green700,
    BUTTON_OUTLINE_BG:       Palette.Green50,
    BUTTON_OUTLINE_BORDER:   Palette.Green200,
    BUTTON_DESTRUCTIVE_TEXT:   Palette.White,
    BUTTON_DESTRUCTIVE_BG:     Palette.Red700,
    BUTTON_DESTRUCTIVE_BORDER: Palette.Red700,
    BUTTON_DISABLED_TEXT:    Palette.Neutral400,
    BUTTON_DISABLED_BG:      Palette.Neutral200,
    BUTTON_DISABLED_BORDER: Palette.Neutral200,

    // UI Elements
    YELLOW:           Palette.Yellow600,
    BLUE:             Palette.Blue600,
    RED:              Palette.Red700,
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

    //Group Avatars
    AVATAR_BG_Green:      Palette.Green700,
    AVATAR_BG_Blue:       Palette.Blue600,
    AVATAR_BG_Red:        Palette.Red650,
    AVATAR_BG_Indigo:     Palette.Indigo400,
    AVATAR_BG_Orange:     Palette.Orange800,

    // Chat Room Specific
    CHAT_BUBBLE_RIGHT_BG:      Palette.Green700,
    CHAT_BUBBLE_LEFT_BG:       Palette.White,
    CHAT_EMERGENCY_BG:         Palette.Red25,
    CHAT_EMERGENCY_BORDER:     Palette.Red700,
    CHAT_EMERGENCY_TEXT:       Palette.Red900,
    CHAT_LINK_RIGHT_NORMAL:    Palette.WhiteAlpha90,
    CHAT_LINK_RIGHT_EMERGENCY: Palette.Red900,
    CHAT_LINK_LEFT_EMERGENCY:  Palette.Red900,
    CHAT_LINK_LEFT_NORMAL:     Palette.Green700,
    CHAT_ATTACHMENT_SUBTITLE_RIGHT:  Palette.WhiteAlpha80,
    CHAT_TIME_TEXT_RIGHT:      Palette.WhiteAlpha70,


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

    STATUS_NEEDS_REVIEW_BG:    Palette.Blue50,
    STATUS_NEEDS_REVIEW_TEXT:  Palette.Blue600,

    STATUS_WAITING_USER_BG:    Palette.Neutral100,
    STATUS_WAITING_USER_TEXT:  Palette.Neutral500,

    STATUS_MAINTENANCE_TEXT:   Palette.Blue600,
    STATUS_MAINTENANCE_BG:     Palette.Blue50,

    STATUS_DOWNPAYMENT_BG:     Palette.Yellow50,
    STATUS_DOWNPAYMENT_TEXT:   Palette.Yellow700,
    STATUS_DOWNPAYMENT_BORDER: Palette.Yellow100,

    STATUS_FULLY_PAID_BG:      Palette.Green50,
    STATUS_FULLY_PAID_TEXT:    Palette.Green700,
    STATUS_FULLY_PAID_BORDER:  Palette.Green100,

    // Weather
    WEATHER_SAFE_MAIN:      Palette.Green700,
    WEATHER_SAFE_BG:        Palette.Green50,
    
    WEATHER_CAUTION_MAIN:   Palette.Yellow700, 
    WEATHER_CAUTION_BG:     Palette.Yellow50,
    
    WEATHER_DANGER_MAIN:    Palette.Red700,
    WEATHER_DANGER_BG:      Palette.Red50,

    WEATHER_SUN:            Palette.Amber500, 
    WEATHER_MOON:           Palette.Indigo400 ,

    // Trail
    TRAIL_STATS_BLUE:       Palette.Blue600,
    TRAIL_STATS_GREEN:      Palette.Green700,
    TRAIL_STATS_YELLOW:     Palette.Yellow600,
    TRAIL_STATS_RED:        Palette.Red700,
    TRAIL_STATS_GRAY:       Palette.Neutral500,
    TRAIL_STATS_ORANGE:      Palette.Orange800,

    TRAIL_RULES_BG:         Palette.White,
    TRAIL_RULES_BORDER:     Palette.Green600,
    TRAIL_RULES_BULLET_BG:  Palette.Green50,
    TRAIL_RULES_BULLET_TEXT:Palette.Green700,
    
    TRAIL_SAFETY_BG:        Palette.White,
    TRAIL_SAFETY_BORDER:    Palette.Amber500,
    TRAIL_SAFETY_BULLET_BG: Palette.Amber100,
    TRAIL_SAFETY_BULLET_TEXT: Palette.Orange800,
    TRAIL_SAFETY_ICON:      Palette.Amber500,

    TRAIL_LGU_BG:           Palette.White,
    TRAIL_LGU_BORDER:       Palette.Indigo400,
    TRAIL_LGU_BULLET_BG:    Palette.Blue100,
    TRAIL_LGU_BULLET_TEXT:  Palette.Blue600,
    TRAIL_LGU_ICON:         Palette.Blue600,
    
    TRAIL_TAG_BORDER:       Palette.Green200,
    TRAIL_TAG_BG:           Palette.White,
    TRAIL_TAG_TEXT:         Palette.Green700,

    TRAIL_TOOLTIP_BG:       Palette.Slate50,
    TRAIL_TOOLTIP_BORDER:   Palette.Slate200,
    TRAIL_ACTIVE_STAT_BG:   Palette.Slate100,

    // Hiking Experience Levels
    EXP_BEGINNER_BG:        Palette.Green400,
    EXP_BEGINNER_TEXT:      Palette.White,
    EXP_REGULAR_BG:         Palette.Green700,
    EXP_REGULAR_TEXT:       Palette.White,
    EXP_EXPERIENCED_BG:     Palette.Blue600,
    EXP_EXPERIENCED_TEXT:   Palette.White,
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