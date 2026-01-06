import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import ConfirmationModal from '../../../components/ConfirmationModal';
import CustomText from '../../../components/CustomText';
import ErrorMessage from '../../../components/ErrorMessage';
import ResponsiveScrollView from '../../../components/ResponsiveScrollView';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { Colors } from '../../../constants/colors';

import SelectionOption from '../components/SelectionOption';

const PreferenceScreen = ({ questions, setAnswer, onFinish, error }) => {

    const router = useRouter();
    const [stepIndex, setStepIndex] = useState(0);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const FLOW_YES = ['q1', 'q2', 'q3', 'q4', 'q5'];
    
    const FLOW_NO  = ['q1', 'q4', 'q5'];

    const hikedBeforeAnswer = questions['q1']?.answer; 
    const currentFlow = hikedBeforeAnswer === 'No' ? FLOW_NO : FLOW_YES;
    const currentStepKey = currentFlow[stepIndex];
    const currentQuestionData = questions[currentStepKey];

    const handleSelect = (value) => {
        setAnswer(currentStepKey, value);
    };

    const handleNext = () => {
        if (stepIndex >= currentFlow.length - 1) {
            setShowConfirmation(true); 
        } else {
            setStepIndex(prev => prev + 1);
        }
    };

    const handleConfirmSave = () => {
        setShowConfirmation(false);
        onFinish();
    };

    const handleEdit = () => {
        setShowConfirmation(false);
    };

    const handleBack = () => {
        if (stepIndex === 0) {
            router.back(); 
        } else {
            setStepIndex(prev => prev - 1);
        }
    };

    const isSelected = (optionValue) => {
        const currentAnswer = currentQuestionData?.answer;
        
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
                        <CustomText style={styles.question}>
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
                        <CustomText style={styles.question}>
                            {currentQuestionData.question}
                        </CustomText>
                        <CustomText style={styles.subLabel}>
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
                        <CustomText style={styles.question}>
                            {currentQuestionData.question}
                        </CustomText>
                        <CustomText style={styles.subLabel}>
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
                visible={showConfirmation}
                title="Save Hiking Preferences?"
                message="Are you ready to submit your preferences and find your trail?"
                onConfirm={handleConfirmSave}
                onClose={handleEdit}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Feather name="chevron-left" size={28} color={Colors.WHITE} />
                </TouchableOpacity>
                <CustomText style={styles.headerTitle}>Thrail</CustomText>
                <View style={{ width: 28 }} />
            </View>

            <ResponsiveScrollView 
                minHeight={600} 
                style={styles.container} 
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.formConstrainer}>
                    <CustomText variant="h2" style={styles.pageTitle}>Preference</CustomText>

                    <ErrorMessage error={error} />

                    <View style={styles.questionArea}>
                        {renderContent()}
                    </View>

                    <View style={styles.footer}>
                        {stepIndex > 0 ? (
                            <TouchableOpacity onPress={handleBack}>
                                <CustomText style={styles.prevText}>Previous</CustomText>
                            </TouchableOpacity>
                        ) : ( <View /> )}

                        <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                            <CustomText style={styles.nextText}>
                                {stepIndex >= currentFlow.length - 1 ? "Finish" : "Next"}
                            </CustomText>
                            <Feather name="chevron-right" size={18} color={Colors.WHITE} />
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 15,
        backgroundColor: Colors.PRIMARY,
        width: '100%',
    },
    headerTitle: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        color: Colors.WHITE 
    },
    contentContainer: { 
        flexGrow: 1, 
        paddingHorizontal: 24, 
        paddingTop: 30 
    },
    formConstrainer: { 
        width: '100%', 
        maxWidth: 400, 
        alignSelf: 'center', 
        flex: 1 
    },
    pageTitle: { 
        textAlign: 'center', 
        marginBottom: 30, 
        fontSize: 24, 
        fontWeight: 'bold' 
    },
    questionArea: { 
        flex: 1, 
        marginBottom: 30,
    },
    question: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginBottom: 15, 
        color: Colors.BLACK 
    },
    subLabel: { 
        fontSize: 14, 
        fontStyle: 'italic', 
        marginBottom: 15, 
        color: Colors.GRAY_MEDIUM 
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
        marginTop: 30, 
        marginBottom: 30 
    },
    prevText: { 
        color: Colors.PRIMARY, 
        fontWeight: '600', 
        fontSize: 16 
    },
    nextButton: {
        backgroundColor: Colors.PRIMARY, 
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 24,
        gap: 8,
    },
    nextText: { 
        color: Colors.WHITE, 
        fontWeight: 'bold', 
        fontSize: 16 
    },
});

export default PreferenceScreen;