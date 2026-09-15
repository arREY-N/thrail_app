/**
 * @file TrailRulesSection.tsx
 * @description Rules, Safety & Advisories card section for the TrailWrite form (Card 4).
 * Encapsulates Critical Trail Update (emergency banner), Rules of the Trail (required guidelines),
 * Keep Safe tips, and LGU Ordinances using CustomFeedbackInput with presets.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { TEdit } from '@/src/core/interface/domainHookInterface';
import { Trail } from '@/src/core/models/Trail/Trail';
import TrailCardHeader from '@/src/features/SuperAdmin/components/trail/TrailCardHeader';

export interface TrailRulesSectionProps {
    trail: Trail;
    isComplete: boolean;
    hasError: boolean;
    isDesktop: boolean;
    isMobile: boolean;
    onUpdateField: (params: TEdit<Trail>) => void;
}

const PRESET_LGU_RULES = [
    'Mandatory registration at Barangay Hall',
    'Environmental fee of PHP 50 per hiker',
    'Accredited local guide required',
];

const PRESET_GUIDELINES = [
    'Practice Leave No Trace principles',
    'Strictly no smoking, vaping, or open campfires',
    'Stay on marked trails at all times',
    'Pack out all your trash and food waste',
];

const PRESET_SAFETY_TIPS = [
    'Bring at least 2 liters of drinking water',
    'Wear sturdy trekking shoes with good grip',
    'Check weather advisory before departure',
    'Bring a whistle, headlamp, and first aid kit',
];

const parseCleanLines = (text: string): string[] => {
    return text
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);
};

const TrailRulesSection: React.FC<TrailRulesSectionProps> = ({
    trail,
    isComplete,
    hasError,
    isDesktop,
    isMobile,
    onUpdateField,
}) => {
    const lguRulesText = Array.isArray(trail?.general?.lgu_rules)
        ? trail.general.lgu_rules.filter((line: string) => line.trim().length > 0).join('\n')
        : (trail?.general?.lgu_rules || '');

    const guidelinesText = Array.isArray(trail?.general?.guidelines)
        ? trail.general.guidelines.filter((line: string) => line.trim().length > 0).join('\n')
        : (trail?.general?.guidelines || '');

    const safetyTipsText = Array.isArray(trail?.general?.safety_tips)
        ? trail.general.safety_tips.filter((line: string) => line.trim().length > 0).join('\n')
        : (trail?.general?.safety_tips || '');


    return (
        <View style={[styles.sectionCard, { padding: isMobile ? 16 : 24 }]}>
            <TrailCardHeader
                title="Rules, Safety & Advisories"
                subtitle="Trail guidelines, municipal ordinances, safety advice, and urgent alerts"
                iconName="shield"
                iconLibrary="Feather"
                status={isComplete ? 'ready' : 'required'}
                hasError={hasError}
                isDesktop={isDesktop}
                isMobile={isMobile}
            />

            <View style={styles.cardDivider} />

            <View style={styles.cardBody}>
                {/* 1. Critical Trail Update (Optional Emergency Banner) */}
                <View style={styles.fieldBlock}>
                    <CustomTextInput
                        label="Critical Trail Update"
                        placeholder="e.g. Bridge beyond Camp 2 under repair. Trail opens at 6:00 AM only."
                        value={trail?.general?.critical_info || ''}
                        onChangeText={(val: string) => onUpdateField({ section: 'general', id: 'critical_info', value: val })}
                        style={styles.noMarginBottom}
                    />
                    <CustomText variant="caption" style={styles.helperText}>
                        {"Displays as a prominent red warning banner at the top of the hiker's trail screen."}
                    </CustomText>
                </View>

                {/* 2. LGU Ordinances */}
                <View style={styles.fieldBlock}>
                    <CustomFeedbackInput
                        label="LGU Ordinances"
                        placeholder="e.g. Mandatory registration at Barangay Hall&#10;Environmental fee of PHP 50 per hiker"
                        value={lguRulesText}
                        onChangeText={(text: string) => onUpdateField({ section: 'general', id: 'lgu_rules', value: parseCleanLines(text) })}
                        suggestions={PRESET_LGU_RULES}
                        helperText="Type each municipal rule on a new line. Displays in the LGU Ordinances section."
                    />
                </View>

                {/* 3. Rules of the Trail (Required Guidelines) */}
                <View style={styles.fieldBlock}>
                    <CustomFeedbackInput
                        label="Rules of the Trail *"
                        placeholder="e.g. Practice Leave No Trace principles&#10;Strictly no smoking or campfires&#10;Stay on designated trails"
                        value={guidelinesText}
                        onChangeText={(text: string) => onUpdateField({ section: 'general', id: 'guidelines', value: parseCleanLines(text) })}
                        suggestions={PRESET_GUIDELINES}
                        helperText="Type each rule on a new line. Each line becomes a verified checkbox item for hikers."
                    />
                </View>

                {/* 4. Keep Safe Tips */}
                <View style={styles.fieldBlock}>
                    <CustomFeedbackInput
                        label="Keep Safe Tips"
                        placeholder="e.g. Bring at least 2 liters of drinking water&#10;Wear sturdy trekking shoes&#10;Check weather forecast"
                        value={safetyTipsText}
                        onChangeText={(text: string) => onUpdateField({ section: 'general', id: 'safety_tips', value: parseCleanLines(text) })}
                        suggestions={PRESET_SAFETY_TIPS}
                        helperText="Type each safety tip on a new line. Displays with shield icons in the Keep Safe section."
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    sectionCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(2),
        elevation: 2,
    },
    cardDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginVertical: 16,
    },
    cardBody: {
        gap: 24,
    },
    fieldBlock: {
        width: '100%',
    },
    noMarginBottom: {
        marginBottom: 0,
    },
    helperText: {
        color: Colors.TEXT_SECONDARY,
        fontSize: 12,
        marginTop: 4,
    },
});

export default TrailRulesSection;
