import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ErrorMessage from '@/src/components/ErrorMessage';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';

import SelectionOption from '@/src/features/Auth/components/SelectionOption';

const PreferenceScreen = ({ 
    questions, 
    setAnswer, 
    onFinish, 
    error 
}) => {

    const [stepIndex, setStepIndex] = useState(0);
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

    const FLOW_YES = ['q1', 'q2', 'q3', 'q4', 'q5'];
    const FLOW_NO  = ['q1', 'q4', 'q5'];

    const hikedBeforeAnswer = questions['q1']?.answer; 
    const currentFlow = hikedBeforeAnswer === false ? FLOW_NO : FLOW_YES;
    const currentStepKey = currentFlow[stepIndex];
    const currentQuestionData = questions[currentStepKey];

    const currentAnswer = currentQuestionData?.answer;
    const hasAnswer = Array.isArray(currentAnswer) 
        ? currentAnswer.length > 0 
        : currentAnswer !== null && currentAnswer !== undefined && currentAnswer !== '';

    const progressPercentage = stepIndex === 0 
        ? (1 / FLOW_YES.length) * 100 
        : ((stepIndex + 1) / currentFlow.length) * 100;

    const handleSelect = (value) => {
        setAnswer(currentStepKey, value);
    };

    const handleNext = () => {
        if (!hasAnswer) return;

        if (stepIndex >= currentFlow.length - 1) {
            setShowSaveConfirmation(true); 
        } else {
            setStepIndex(prev => prev + 1);
        }
    };

    const handleConfirmSave = () => {
        setShowSaveConfirmation(false);
        onFinish();
    };

    const handleBack = () => {
        if (stepIndex > 0) {
            setStepIndex(prev => prev - 1);
        }
    };

    const isSelected = (optionValue) => {
        if (currentAnswer === null || currentAnswer === undefined) return false;

        if (currentQuestionData?.type === 'binary') {
            const mappedBoolean = optionValue === 'Yes' ? true : false;
            return currentAnswer === mappedBoolean;
        }

        if (Array.isArray(currentAnswer)) {
            return currentAnswer.includes(optionValue);
        } else {
            return currentAnswer === optionValue;
        }
    };

    const renderOptions = () => {
        const dynamicOptions = currentQuestionData?.options || [];

        if (currentStepKey === 'q5') {
            return (
                <View style={styles.gridContainer}>
                    {dynamicOptions.map(opt => (
                        <View key={opt} style={styles.gridItem}>
                            <SelectionOption 
                                label={opt} 
                                selected={isSelected(opt)} 
                                onPress={() => handleSelect(opt)}
                            />
                        </View>
                    ))}
                </View>
            );
        }

        return (
            <View style={styles.optionsWrapper}>
                {dynamicOptions.map(opt => (
                    <SelectionOption 
                        key={opt}
                        label={opt} 
                        selected={isSelected(opt)} 
                        onPress={() => handleSelect(opt)}
                    />
                ))}
            </View>
        );
    };

    const isMultiSelect = ['q2', 'q4', 'q5'].includes(currentStepKey);

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <ConfirmationModal
                visible={showSaveConfirmation}
                title="Save Hiking Preferences"
                message="Are you ready to submit your preferences and find your trail?"
                onConfirm={handleConfirmSave}
                onClose={() => setShowSaveConfirmation(false)}
                confirmText="Save"
                cancelText="Cancel"
            />
            
            <CustomHeader title="Preference" centerTitle={true} />

            <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
            </View>

            <View style={styles.mainContainer}>
                <View style={styles.formConstrainer}>
                    
                    <View style={styles.fixedQuestionArea}>
                        <ErrorMessage error={error} />
                        
                        <CustomText variant="subtitle" style={styles.question}>
                            {currentQuestionData?.question}
                        </CustomText>
                        
                        {isMultiSelect && (
                            <CustomText variant="caption" style={styles.subLabel}>
                                (Select all that apply)
                            </CustomText>
                        )}
                    </View>

                    <ScrollView 
                        style={styles.optionsScrollView}
                        contentContainerStyle={styles.optionsScrollContent}
                        showsVerticalScrollIndicator={false}
                        overScrollMode="never"
                    >
                        {renderOptions()}
                    </ScrollView>

                </View>
            </View>

            <View style={styles.footerContainer}>
                <View style={styles.footerConstrainer}>
                    {stepIndex > 0 ? (
                        <TouchableOpacity onPress={handleBack} style={styles.prevButton}>
                            <CustomIcon 
                                library="Feather" 
                                name="chevron-left" 
                                size={24} 
                                color={Colors.TEXT_SECONDARY} 
                            />
                            <CustomText style={styles.prevText}>
                                Previous
                            </CustomText>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.prevButtonPlaceholder} />
                    )}

                    <TouchableOpacity 
                        onPress={handleNext} 
                        disabled={!hasAnswer}
                        style={[
                            styles.nextButton,
                            !hasAnswer && { opacity: 0.5, backgroundColor: Colors.GRAY_MEDIUM } 
                        ]}
                    >
                        <CustomText style={styles.nextText}>
                            {stepIndex >= currentFlow.length - 1 ? "Finish" : "Next"}
                        </CustomText>
                        
                        <CustomIcon 
                            library="Feather" 
                            name="chevron-right" 
                            size={24} 
                            color={Colors.TEXT_INVERSE} 
                        />
                    </TouchableOpacity>
                </View>
            </View>

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    progressBarBackground: {
        width: '100%',
        height: 3,
        backgroundColor: Colors.GRAY_ULTRALIGHT,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.PRIMARY,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
    },

    mainContainer: { 
        flex: 1,
        paddingHorizontal: 16,
    },
    formConstrainer: { 
        width: '100%', 
        maxWidth: 400, 
        alignSelf: 'center', 
        flex: 1, 
    },
    fixedQuestionArea: {
        paddingTop: 24,
        paddingBottom: 16,
    },
    optionsScrollView: {
        flex: 1,
    },
    optionsScrollContent: {
        paddingBottom: 32,
    },
    question: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        marginBottom: 8, 
        color: Colors.TEXT_PRIMARY 
    },
    subLabel: { 
        fontStyle: 'italic', 
        marginBottom: 16, 
        color: Colors.TEXT_SECONDARY
    },
    optionsWrapper: { 
        width: '100%', 
        flexDirection: 'column'
    },
    gridContainer: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between' 
    },
    gridItem: { 
        width: '48%' 
    },
    
    footerContainer: {
        width: '100%',
        backgroundColor: Colors.BACKGROUND,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 24
    },
    footerConstrainer: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
    },
    prevButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    prevButtonPlaceholder: {
        width: 100,
    },
    prevText: { 
        color: Colors.TEXT_SECONDARY, 
        fontWeight: '600', 
        fontSize: 16,
        marginLeft: 4
    },
    nextButton: {
        backgroundColor: Colors.PRIMARY, 
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 16,
        gap: 8,
    },
    nextText: { 
        color: Colors.TEXT_INVERSE, 
        fontWeight: 'bold', 
        fontSize: 16 
    },
});

export default PreferenceScreen;