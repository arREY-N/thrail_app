import { Colors } from '@/src/constants/colors';

const SemanticColors = {
    ACTION:  { bg: Colors.STATUS_APPROVED_BG, text: Colors.PRIMARY },             
    SUCCESS: { bg: Colors.PRIMARY, text: Colors.WHITE },             
    INFO:    { bg: Colors.STATUS_PENDING_BG, text: Colors.STATUS_PENDING_TEXT }, 
    WAITING: { bg: Colors.STATUS_PENDING_BG, text: Colors.STATUS_PENDING_TEXT }, 
    WARNING: { bg: Colors.STATUS_WARNING_BG, text: Colors.STATUS_WARNING_TEXT },   
    ERROR:   { bg: Colors.ERROR_BG, text: Colors.ERROR }                          
} as const;

export type SemanticColorType = keyof typeof SemanticColors;

export const STATUS_UI_CONFIG = {
    'for-reservation': {
        userLabel: 'UNDER REVIEW', userType: 'INFO',      
        adminLabel: 'NEEDS REVIEW', adminType: 'ACTION',  
        icon: 'clock'
    },
    'pending-docs': {
        userLabel: 'UNDER REVIEW', userType: 'INFO',
        adminLabel: 'NEEDS REVIEW', adminType: 'ACTION',
        icon: 'clock'
    },
    'approved-docs': {
        userLabel: 'COMPLETE PAYMENT', userType: 'ACTION',     
        adminLabel: 'AWAITING PAYMENT', adminType: 'WAITING',
        icon: 'credit-card'
    },
    'for-payment': {
        userLabel: 'COMPLETE PAYMENT', userType: 'ACTION',     
        adminLabel: 'AWAITING PAYMENT', adminType: 'WAITING',
        icon: 'credit-card'
    },
    'downpayment': {
        userLabel: 'PARTIALLY PAID', userType: 'WARNING', 
        adminLabel: 'PARTIALLY PAID', adminType: 'WARNING', 
        icon: 'pie-chart'
    },
    'paid': {
        userLabel: 'VERIFYING PAYMENT', userType: 'INFO', 
        adminLabel: 'VERIFY PAYMENT', adminType: 'ACTION',
        icon: 'check-circle'
    },
    'completed': {
        userLabel: 'COMPLETED', userType: 'SUCCESS',      
        adminLabel: 'COMPLETED', adminType: 'SUCCESS',
        icon: 'check-circle'
    },
    'reservation-rejected': {
        userLabel: 'REJECTED DOCS', userType: 'ERROR',  
        adminLabel: 'REJECTED DOCS', adminType: 'ERROR',
        icon: 'alert-circle'
    },
    'for-reschedule': {
        userLabel: 'RESCHEDULE PENDING', userType: 'INFO', 
        adminLabel: 'REVIEW RESCHEDULE', adminType: 'ACTION', 
        icon: 'calendar'
    },
    'reschedule-rejected': {                              
        userLabel: 'RESCHEDULE DECLINED', userType: 'ERROR',
        adminLabel: 'RESCHEDULE DECLINED', adminType: 'ERROR',
        icon: 'x-octagon'
    },
    'rescheduled': {
        userLabel: 'RESCHEDULED', userType: 'SUCCESS',    
        adminLabel: 'RESCHEDULED', adminType: 'SUCCESS',
        icon: 'calendar'
    },
    'for-cancellation': {
        userLabel: 'CANCELLATION PENDING', userType: 'INFO', 
        adminLabel: 'REVIEW CANCELLATION', adminType: 'ACTION', 
        icon: 'alert-triangle'
    },
    'cancellation-rejected': {
        userLabel: 'CANCEL DECLINED', userType: 'ERROR',
        adminLabel: 'CANCEL DECLINED', adminType: 'ERROR',
        icon: 'x-octagon'
    },
    'cancelled': {
        userLabel: 'CANCELLED', userType: 'ERROR',        
        adminLabel: 'CANCELLED', adminType: 'ERROR',
        icon: 'x-circle'
    },
    'refund': {
        userLabel: 'REFUNDED', userType: 'ERROR',         
        adminLabel: 'REFUNDED', adminType: 'ERROR',
        icon: 'refresh-ccw'
    },
    'refunded': {
        userLabel: 'REFUNDED', userType: 'ERROR',         
        adminLabel: 'REFUNDED', adminType: 'ERROR',
        icon: 'refresh-ccw'
    },
    'finished': {
        userLabel: 'FINISHED', userType: 'SUCCESS',
        adminLabel: 'FINISHED', adminType: 'SUCCESS',
        icon: 'check-circle'
    },
    'expired': {
        userLabel: 'EXPIRED', userType: 'ERROR', 
        adminLabel: 'EXPIRED', adminType: 'ERROR',
        icon: 'clock'
    },
} as const;

export type AppStatus = keyof typeof STATUS_UI_CONFIG;
export type UserRole = 'user' | 'admin';

export interface StatusConfigResult {
    label: string;
    bgColor: string;
    textColor: string;
    icon: string;
}

/**
 * Returns the exact Label, Background Color, Text Color, and Icon based on the user's role.
 * @param {AppStatus | string | null | undefined} status - The raw status from the database.
 * @param {UserRole} role - 'user' or 'admin'. Defaults to 'user'.
 * @returns {StatusConfigResult} The UI configuration for the given status and role.
 */
export const getStatusConfig = (
    status: AppStatus | string | null | undefined, 
    role: UserRole = 'user'
): StatusConfigResult => {
    // If we have a valid key in our dictionary
    const config = (status && status in STATUS_UI_CONFIG) 
        ? STATUS_UI_CONFIG[status as AppStatus] 
        : null;

    if (!config) {
        return { 
            label: status ? status.toUpperCase() : 'UNKNOWN', 
            bgColor: SemanticColors.INFO.bg,
            textColor: SemanticColors.INFO.text,
            icon: 'help-circle' 
        };
    }

    const typeKey = role === 'admin' ? config.adminType : config.userType;
    const colors = SemanticColors[typeKey as SemanticColorType] || SemanticColors.INFO;

    return {
        label: role === 'admin' ? config.adminLabel : config.userLabel,
        bgColor: colors.bg,
        textColor: colors.text,
        icon: config.icon
    };
};
