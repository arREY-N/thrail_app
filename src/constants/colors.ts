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
    Blue400:    '#42A5F5',
    Blue100:    '#BBDEFB',
    Blue50:     '#E3F2FD',
    Indigo400:  '#5C6BC0',
    Slate200:   '#E2E8F0',
    Slate150:   '#E9ECEF',
    Slate100:   '#F1F5F9',
    Slate50:    '#F8F9FA',
    Neutral30:  '#F9FAFB',

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

    // Browns & Earth
    Brown600:   '#795548',
    Brown500:   '#8D6E63',
    Brown100:   '#D7CCC8',

    // Metals (Gold/Silver/Bronze)
    Gold700:   '#D97706',
    Gold500:   '#F59E0B',
    Gold100:   '#FEF3C7',
    Silver700: '#475569',
    Silver500: '#64748B',
    Silver100: '#F1F5F9',
    Bronze700: '#92400E',
    Bronze500: '#D97706',
    Bronze100: '#FFEDD5',

    // Transparencies
    BlackAlpha50: 'rgba(0, 0, 0, 0.5)',
    WhiteAlpha90: 'rgba(255, 255, 255, 0.9)',
    WhiteAlpha80: 'rgba(255, 255, 255, 0.8)',
    WhiteAlpha70: 'rgba(255, 255, 255, 0.7)',
    WhiteAlpha50: 'rgba(255, 255, 255, 0.5)',
    WhiteAlpha0:  'rgba(255, 255, 255, 0)',
    GrayAlpha25:  '#C4C4C440',
    OffWhiteAlpha75: 'rgba(250, 252, 250, 0.75)',
    OffWhiteAlpha0:  'rgba(250, 252, 250, 0)',
};

export const Colors = {
    // Brand & Backgrounds
    PRIMARY:          Palette.Green700, 
    SECONDARY:        Palette.Green400,
    BACKGROUND:       Palette.OffWhite,
    BACKGROUND_FADE:  Palette.OffWhiteAlpha75,
    BACKGROUND_TRANSPARENT: Palette.OffWhiteAlpha0,

    // Core Neutrals
    BLACK:            Palette.Neutral900,
    WHITE:            Palette.White,
    WHITE_TRANSPARENT:Palette.WhiteAlpha0,
    WHITE_FADE_HALF:  Palette.WhiteAlpha50,
    WHITE_FADE:       Palette.WhiteAlpha70,
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

    // UI Elements & Chart Accents
    YELLOW:           Palette.Yellow600,
    BLUE:             Palette.Blue600,
    BLUE_LIGHT:       Palette.Blue400,
    RED:              Palette.Red700,
    ORANGE:           Palette.Orange800,
    SHADOW:           Palette.TrueBlack,
    MODAL_OVERLAY:    Palette.BlackAlpha50,
    SEARCH_BAR_BG:    Palette.GrayAlpha25,

    // Base Statuses
    ERROR:            Palette.Red700,
    ERROR_BG:         Palette.Red50,
    ERROR_BORDER:     Palette.Red100,
    SUCCESS:          Palette.Green700,
    WARNING:          Palette.Red700,

    // Pills & Chips
    CHIP_PRIMARY_BG:    Palette.Green50,
    CHIP_PRIMARY_TEXT:  Palette.Green700,
    CHIP_PRIMARY_BORDER:Palette.Green100,
    CHIP_SECONDARY_BG:  Palette.White,
    CHIP_SECONDARY_TEXT:Palette.Neutral500,
    CHIP_SECONDARY_BORDER:Palette.Neutral200,


    // Password/Action Strength
    STRENGTH_EMPTY:   Palette.Neutral50,
    STRENGTH_WEAK:    Palette.Red700,
    STRENGTH_MEDIUM:  Palette.Amber500,
    STRENGTH_STRONG:  Palette.Green700,

    // Group Avatars
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

    // Chart Design System Tokens
    CHART_PRIMARY:        Palette.Green700,
    CHART_SECONDARY:      Palette.Green600,
    CHART_TERTIARY:       Palette.Red650,
    CHART_ACCENT:         Palette.Indigo400,
    CHART_BG_SURFACE:     Palette.Slate50,
    CHART_BORDER:         Palette.Slate200,

    // Chart Dual Wave Tokens
    CHART_WAVE_REGISTERED_STROKE: Palette.Green400,
    CHART_WAVE_REGISTERED_FILL:   Palette.Green200,
    CHART_WAVE_ACTIVE_STROKE:     Palette.Green700,
    CHART_WAVE_ACTIVE_FILL:       Palette.Green400,

    // Interactive Chips
    CHIP_INACTIVE:    Palette.Neutral100, 
    CHIP_ACTIVE:      Palette.Green700,

    // Role Specific Semantic Color Tokens (Matching ProfileInfoScreen.tsx)
    ROLE_SUPERADMIN_BG:     Palette.Red700,
    ROLE_SUPERADMIN_TEXT:   Palette.White,
    ROLE_SUPERADMIN_BORDER: Palette.Red700,

    ROLE_ADMIN_BG:          Palette.Green700,
    ROLE_ADMIN_TEXT:        Palette.White,
    ROLE_ADMIN_BORDER:      Palette.Green700,

    ROLE_HIKER_BG:          Palette.Green400,
    ROLE_HIKER_TEXT:        Palette.White,
    ROLE_HIKER_BORDER:      Palette.Green400,

    ROLE_AVATAR_BG:         Palette.Green700,
    ROLE_AVATAR_TEXT:       Palette.White,

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

    // Trail Semantic Color Tokens
    TRAIL_CLASSIFICATION_MAJOR_BG:     Palette.Red50,
    TRAIL_CLASSIFICATION_MAJOR_TEXT:   Palette.Red700,
    TRAIL_CLASSIFICATION_MAJOR_BORDER: Palette.Red100,

    TRAIL_CLASSIFICATION_MINOR_BG:     Palette.Neutral100,
    TRAIL_CLASSIFICATION_MINOR_TEXT:   Palette.Neutral900,
    TRAIL_CLASSIFICATION_MINOR_BORDER: Palette.Neutral200,

    TRAIL_STATUS_ACTIVE_BG:            Palette.Green50,
    TRAIL_STATUS_ACTIVE_TEXT:          Palette.Green700,
    TRAIL_STATUS_ACTIVE_BORDER:        Palette.Green100,

    TRAIL_STATUS_INACTIVE_BG:          Palette.Red50,
    TRAIL_STATUS_INACTIVE_TEXT:        Palette.Red700,
    TRAIL_STATUS_INACTIVE_BORDER:      Palette.Red100,

    // Medical Warning Banner & Expired Verification Alerts
    MEDICAL_BADGE_BG:          Palette.Blue50,
    MEDICAL_BADGE_TEXT:        Palette.Blue600,
    MEDICAL_BADGE_BORDER:      Palette.Blue100,

    VERIFICATION_EXPIRED_BG:   Palette.Red50,
    VERIFICATION_EXPIRED_TEXT: Palette.Red700,
    VERIFICATION_EXPIRED_BORDER: Palette.Red100,

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

    // Dynamic Badges & Summary Containers
    DAY_CONTAINER_BG:       Palette.Slate50,
    DAY_BORDER:             Palette.Slate150,
    INFO_CHIP_BG:           Palette.Neutral30,

    // Leaderboard Semantic Tokens
    LEADERBOARD_GOLD:          Palette.Gold500,
    LEADERBOARD_GOLD_BG:       Palette.Gold100,
    LEADERBOARD_GOLD_ACCENT:   Palette.Gold700,
    LEADERBOARD_SILVER:        Palette.Silver500,
    LEADERBOARD_SILVER_BG:     Palette.Silver100,
    LEADERBOARD_SILVER_ACCENT: Palette.Silver700,
    LEADERBOARD_BRONZE:        Palette.Bronze500,
    LEADERBOARD_BRONZE_BG:     Palette.Bronze100,
    LEADERBOARD_BRONZE_ACCENT: Palette.Bronze700,
    LEADERBOARD_PEAK_BASE:     Palette.Green700,

    // Map Pin & Waypoint Semantic Tokens
    PIN_SUMMIT:                Palette.Red700,
    PIN_CHECKPOINT:            Palette.Orange800,
    PIN_VIEWPOINT:             Palette.Green700,
    PIN_WATER:                 Palette.Blue600,
    PIN_SHELTER:               Palette.Brown600,
    PIN_HAZARD:                Palette.Red900,
    PIN_BADGE_BG:              Palette.Green50,
    PIN_BADGE_BORDER:          Palette.Green100,
    PIN_BADGE_TEXT:            Palette.Green700,
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