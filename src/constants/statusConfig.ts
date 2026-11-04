import { Colors } from '@/src/constants/colors';
import { IconLibrary } from '@/src/types/ui.types';

const SemanticColors = {
    ACTION:  { bg: Colors.STATUS_APPROVED_BG, text: Colors.PRIMARY, border: Colors.STATUS_APPROVED_BORDER },             
    SUCCESS: { bg: Colors.STATUS_APPROVED_BG, text: Colors.PRIMARY, border: Colors.STATUS_APPROVED_BORDER },             
    INFO:    { bg: Colors.STATUS_PENDING_BG, text: Colors.STATUS_PENDING_TEXT, border: Colors.STATUS_PENDING_BORDER }, 
    WAITING: { bg: Colors.STATUS_PENDING_BG, text: Colors.STATUS_PENDING_TEXT, border: Colors.STATUS_PENDING_BORDER }, 
    WARNING: { bg: Colors.STATUS_WARNING_BG, text: Colors.STATUS_WARNING_TEXT, border: Colors.STATUS_WARNING_BORDER },   
    ERROR:   { bg: Colors.ERROR_BG, text: Colors.ERROR, border: Colors.ERROR_BORDER }                          
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
    'verifying-payment': {
        userLabel: 'VERIFYING PAYMENT', userType: 'INFO',
        adminLabel: 'VERIFY PAYMENT', adminType: 'ACTION',
        icon: 'clock'
    },
    'payment-rejected': {
        userLabel: 'PAYMENT REJECTED', userType: 'ERROR',
        adminLabel: 'PAYMENT REJECTED', adminType: 'ERROR',
        icon: 'alert-circle'
    },
    'awaiting-confirmation': {
        userLabel: 'CONFIRMATION PENDING', userType: 'INFO',
        adminLabel: 'CONFIRM BOOKING', adminType: 'ACTION',
        icon: 'clock'
    },
    'downpayment': {
        userLabel: 'DOWNPAYMENT', userType: 'WARNING', 
        adminLabel: 'DOWNPAYMENT', adminType: 'WARNING', 
        icon: 'pie-chart'
    },
    'paid': {
        userLabel: 'PAID', userType: 'SUCCESS', 
        adminLabel: 'PAID', adminType: 'ACTION',
        icon: 'check-circle'
    },
    'completed': {
        userLabel: 'COMPLETED', userType: 'SUCCESS',      
        adminLabel: 'COMPLETED', adminType: 'SUCCESS',
        icon: 'check-circle'
    },
    'reservation-rejected': {
        userLabel: 'REJECTED BOOKING', userType: 'ERROR',  
        adminLabel: 'REJECTED BOOKING', adminType: 'ERROR',
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
        userLabel: 'CANCELLATION PENDING', userType: 'ERROR', 
        adminLabel: 'REVIEW CANCELLATION', adminType: 'ERROR', 
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
        userLabel: 'REFUNDING', userType: 'WARNING',         
        adminLabel: 'REFUNDING', adminType: 'WARNING',
        icon: 'refresh-ccw'
    },
    'refund-disputed': {
        userLabel: 'REFUND DISPUTED', userType: 'ERROR',
        adminLabel: 'REFUND DISPUTED', adminType: 'ERROR',
        icon: 'alert-triangle'
    },
    'awaiting-wallet': {
        userLabel: 'SUBMIT WALLET', userType: 'ACTION',
        adminLabel: 'AWAITING WALLET', adminType: 'WAITING',
        icon: 'credit-card'
    },
    'awaiting-payout': {
        userLabel: 'PAYOUT IN PROGRESS', userType: 'INFO',
        adminLabel: 'DISBURSE PAYOUT', adminType: 'ACTION',
        icon: 'refresh-ccw'
    },
    'overpayment-pending': {
        userLabel: 'EXCESS PAYMENT', userType: 'WARNING',
        adminLabel: 'REVIEW OVERPAYMENT', adminType: 'ACTION',
        icon: 'dollar-sign'
    },
    'overpaid': {
        userLabel: 'OVERPAID',
        userType: 'WARNING',
        adminLabel: 'OVERPAID',
        adminType: 'WARNING',
        icon: 'alert-circle',
    },
    'refunded': {
        userLabel: 'REFUNDED', userType: 'ERROR',         
        adminLabel: 'REFUNDED', adminType: 'ERROR',
        icon: 'peso-sign',
        iconLibrary: 'FontAwesome6' as IconLibrary,
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
    borderColor?: string;
    icon: string;
    iconLibrary?: IconLibrary;
}

/**
 * Returns the exact Label, Background Color, Text Color, Border Color, and Icon based on the user's role.
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
            borderColor: SemanticColors.INFO.border,
            icon: 'help-circle' 
        };
    }

    const typeKey = role === 'admin' ? config.adminType : config.userType;
    const colors = SemanticColors[typeKey as SemanticColorType] || SemanticColors.INFO;

    return {
        label: role === 'admin' ? config.adminLabel : config.userLabel,
        bgColor: colors.bg,
        textColor: colors.text,
        borderColor: colors.border,
        icon: config.icon,
        iconLibrary: 'iconLibrary' in config ? (config.iconLibrary as IconLibrary) : undefined,
    };
};
