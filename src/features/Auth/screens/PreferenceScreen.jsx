import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import ConfirmationModal from '../../../components/ConfirmationModal';
import CustomHeader from '../../../components/CustomHeader';
import CustomText from '../../../components/CustomText';
import ErrorMessage from '../../../components/ErrorMessage';
import ResponsiveScrollView from '../../../components/ResponsiveScrollView';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { Colors } from '../../../constants/colors';

import SelectionOption from '../components/SelectionOption';

const PreferenceScreen = ({ 
    questions, 
    setAnswer, 
    onFinish, 
    error 
}) => {

    const router = useRouter();
    const [stepIndex, setStepIndex] = useState(0);
    
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const [showExitConfirmation, setShowExitConfirmation] = useState(false);

    const FLOW_YES = ['q1', 'q2', 'q3', 'q4', 'q5'];
    const FLOW_NO  = ['q1', 'q4', 'q5'];

    const hikedBeforeAnswer = questions['q1']?.answer; 
    const currentFlow = hikedBeforeAnswer === 'No' ? FLOW_NO : FLOW_YES;
    const currentStepKey = currentFlow[stepIndex];
    const currentQuestionData = questions[currentStepKey];

    const currentAnswer = currentQuestionData?.answer;
    const hasAnswer = Array.isArray(currentAnswer) 
        ? currentAnswer.length > 0 
        : currentAnswer !== null && currentAnswer !== undefined && currentAnswer !== '';

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

    const handleCloseModals = () => {
        setShowSaveConfirmation(false);
        setShowExitConfirmation(false);
    };

    const handleBack = () => {
        if (stepIndex === 0) {
            setShowExitConfirmation(true);
        } else {
            setStepIndex(prev => prev - 1);
        }
    };

    const handleConfirmExit = () => {
        setShowExitConfirmation(false);
        router.replace('/(tabs)'); 
    };

    const isSelected = (optionValue) => {
        if (currentAnswer === null || currentAnswer === undefined) return false;

        if (Array.isArray(currentAnswer)) {
            return currentAnswer.includes(optionValue);
        } else {
            return currentAnswer === optionValue;
        }
    };

    const renderContent = () => {
        const dynamicOptions = currentQuestionData?.options || [];

        switch (currentStepKey) {
            case 'q1':
            case 'q3':
                return (
                    <>
                        <CustomText variant="subtitle" style={styles.question}>
                            {currentQuestionData.question}
                        </CustomText>

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
                    </>
                );

            case 'q2':
            case 'q4':
                return (
                    <>
                        <CustomText variant="subtitle" style={styles.question}>
                            {currentQuestionData.question}
                        </CustomText>

                        <CustomText variant="caption" style={styles.subLabel}>
                            (Select all that apply)
                        </CustomText>

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
                    </>
                );

            case 'q5':
                return (
                    <>
                        <CustomText variant="subtitle" style={styles.question}>
                            {currentQuestionData.question}
                        </CustomText>

                        <CustomText variant="caption" style={styles.subLabel}>
                            (Select all that apply)
                        </CustomText>
                        
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
                    </>
                );
            
            default:
                return null;
        }
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <ConfirmationModal
                visible={showSaveConfirmation}
                title="Save Hiking Preferences?"
                message="Are you ready to submit your preferences and find your trail?"
                onConfirm={handleConfirmSave}
                onClose={handleCloseModals}
                confirmText="Save"
                cancelText="Edit"
            />

            <ConfirmationModal
                visible={showExitConfirmation}
                title="Skip Preferences?"
                message="You haven't finished setting up your profile. Are you sure you want to go back?"
                onConfirm={handleConfirmExit}
                onClose={handleCloseModals}
                confirmText="Skip"
                cancelText="Stay"
            />

            <CustomHeader onBackPress={handleBack} />

            <ResponsiveScrollView 
                minHeight={600} 
                style={styles.container} 
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.formConstrainer}>
                    <CustomText variant="subtitle" style={styles.pageTitle}>
                        Preference
                    </CustomText>

                    <ErrorMessage error={error} />

                    <View style={styles.questionArea}>
                        {renderContent()}
                    </View>

                    <View style={styles.footer}>
                        {stepIndex > 0 ? (
                            <TouchableOpacity onPress={handleBack} style={styles.prevButton}>
                                <CustomIcon 
                                    library="Feather" 
                                    name="chevron-left" 
                                    size={24} 
                                    color={Colors.PRIMARY} 
                                />

                                <CustomText style={styles.prevText}>
                                    Previous
                                </CustomText>
                            </TouchableOpacity>
                        ) : ( <View /> )}

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
                                color={Colors.WHITE} 
                            />
                        </TouchableOpacity>
                    </View>

                </View>
            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1 
    },
    contentContainer: { 
        flexGrow: 1, 
        paddingHorizontal: 16, 
        paddingTop: 32 
    },
    formConstrainer: { 
        width: '100%', 
        maxWidth: 400, 
        alignSelf: 'center', 
        flex: 1 
    },
    pageTitle: { 
        textAlign: 'center', 
        marginBottom: 32, 
        fontWeight: 'bold' 
    },
    questionArea: { 
        flex: 1, 
        paddingBottom: 32
    },
    question: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginBottom: 16, 
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
    footer: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: 32, 
        marginBottom: 32 
    },
    prevButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    prevText: { 
        color: Colors.PRIMARY, 
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
        borderRadius: 24,
        gap: 8,
    },
    nextText: { 
        color: Colors.TEXT_INVERSE, 
        fontWeight: 'bold', 
        fontSize: 16 
    },
});

export default PreferenceScreen;