import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import ErrorMessage from '@/src/components/ErrorMessage';
import CustomText from '../../../components/CustomText';
import CustomTextInput from '../../../components/CustomTextInput';
import ResponsiveScrollView from '../../../components/ResponsiveScrollView';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { Colors } from '../../../constants/colors';

import SelectionOption from '../components/SelectionOption';

const PreferenceScreen = ({ questions, setAnswer, onFinish, error }) => {
    const router = useRouter();
    const [stepIndex, setStepIndex] = useState(0);

    const FLOW_YES = ['q1', 'q5', 'q2', 'q4', 'q3'];
    const FLOW_NO  = ['q1', 'q4', 'q3'];

    const hikedBeforeAnswer = questions['q1']?.answer; 
    const currentFlow = hikedBeforeAnswer === 'No' ? FLOW_NO : FLOW_YES;
    const currentStepKey = currentFlow[stepIndex];

    const handleSingleSelect = (questionId, value) => {
        setAnswer(questionId, value);
    };

    const handleMultiSelect = (questionId, value) => {
        const currentList = questions[questionId]?.answer || [];
        let newList;
        if (currentList.includes(value)) {
            newList = currentList.filter(item => item !== value);
        } else {
            newList = [...currentList, value];
        }
        setAnswer(questionId, newList);
    };

    const handleNext = () => {
        if (stepIndex >= currentFlow.length - 1) {
            onFinish();
        } else {
            setStepIndex(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (stepIndex === 0) {
            router.back(); 
        } else {
            setStepIndex(prev => prev - 1);
        }
    };

    const renderContent = () => {
        const currentAnswer = questions[currentStepKey]?.answer;

        switch (currentStepKey) {
            
            case 'q1': 
                return (
                    <>
                        <CustomText style={styles.question}>Have you hiked before?</CustomText>
                        <SelectionOption 
                            label="Yes" 
                            selected={currentAnswer === 'Yes'} 
                            onPress={() => handleSingleSelect('q1', 'Yes')}
                        />
                        <SelectionOption 
                            label="No" 
                            selected={currentAnswer === 'No'} 
                            onPress={() => handleSingleSelect('q1', 'No')}
                        />
                    </>
                );

            case 'q2': 
                return (
                    <>
                        <CustomText style={styles.question}>What is your hiking experience level?</CustomText>
                        {['Beginner', 'Regular', 'Experienced'].map(opt => (
                            <SelectionOption 
                                key={opt}
                                label={opt} 
                                selected={currentAnswer === opt} 
                                onPress={() => handleSingleSelect('q2', opt)}
                            />
                        ))}
                    </>
                );

            case 'q3': 
                return (
                    <>
                        <CustomText style={styles.question}>
                            Which province(s) in Region IV-A (CALABARZON) would you like to explore?
                        </CustomText>
                        <CustomText style={styles.subLabel}>(Select All that apply)</CustomText>
                        
                        <View style={styles.gridContainer}>
                            {['Cavite', 'Laguna', 'Batangas', 'Rizal', 'Quezon'].map(opt => (
                                <View key={opt} style={styles.gridItem}>
                                    <SelectionOption 
                                        label={opt} 
                                        selected={currentAnswer?.includes(opt)} 
                                        onPress={() => handleMultiSelect('q3', opt)}
                                    />
                                </View>
                            ))}
                        </View>
                    </>
                );

            case 'q4': 
                return (
                    <>
                        <CustomText style={styles.question}>How long do you prefer your hikes to be?</CustomText>
                        <CustomText style={styles.subLabel}>(Select All that apply)</CustomText>
                        
                        {['1-3 hours', 'Half-day', 'Full-day', 'Overnight', 'Multi-day'].map(opt => (
                            <SelectionOption 
                                key={opt}
                                label={opt} 
                                selected={currentAnswer?.includes(opt)} 
                                onPress={() => handleMultiSelect('q4', opt)}
                            />
                        ))}
                    </>
                );

            case 'q5': 
                return (
                    <>
                        <CustomText style={styles.question}>Which mountain(s) have you hiked?</CustomText>
                        <CustomTextInput 
                            placeholder="Type/Select the mountain(s)"
                            value={currentAnswer || ''}
                            onChangeText={(text) => handleSingleSelect('q5', text)}
                        />
                    </>
                );
            
            default:
                return null;
        }
    };

    return (
        <ScreenWrapper backgroundColor={Colors.Background}>
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
        backgroundColor: Colors.PrimaryColor,
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
        marginBottom: 30 
    },
    question: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginBottom: 15, 
        color: Colors.BLACK 
    },
    subLabel: { fontSize: 14, 
        fontStyle: 'italic', 
        marginBottom: 15, 
        color: Colors.GRAY_MEDIUM 
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
        marginTop: 'auto', 
        marginBottom: 30 
    },
    
    prevText: { 
        color: Colors.PrimaryColor, 
        fontWeight: '600', 
        fontSize: 16 
    },
    nextButton: {
        backgroundColor: Colors.PrimaryColor, 
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