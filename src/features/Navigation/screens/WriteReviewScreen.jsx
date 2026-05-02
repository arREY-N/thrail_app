import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomFeedbackInput from '@/src/components/CustomFeedbackInput';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import DocumentUploadCard from '@/src/components/DocumentUploadCard';
import ErrorMessage from '@/src/components/ErrorMessage';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';

const DIFFICULTY_LEVELS = [
    { label: 'Easy', icon: 'emoticon-outline' },
    { label: 'Just Right', icon: 'emoticon-happy-outline' },
    { label: 'Moderate', icon: 'emoticon-neutral-outline' },
    { label: 'Hard', icon: 'emoticon-sad-outline' },
    { label: 'Extreme', icon: 'emoticon-angry-outline' }
];

const MAINTENANCE_OPTIONS = [
    { label: 'New/well-maintained', value: 'Easy' },
    { label: 'Damaged but usable', value: 'Moderate' },
    { label: 'Critical and unusable', value: 'Extreme' }
];

const DIFFICULTY_FACTORS = [
    'Trail slope', 'Trail length', 'Weather', 
    'Path condition', 'Fitness', 'Signage',
    'Altitude', 'Mud/Slippery'
];

const FAVORED_FACTORS = [
    'Scenic views', 'Shelters', 'Resting Places', 
    'Information Boards', 'Natural Features', 'Cultural sites',
    'Wildlife', 'Summit Marker'
];

const WriteReviewScreen = ({ 
    review, 
    isLoading, 
    error, 
    onUpdatePress, 
    onSaveReview,
    onBackPress
}) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

    const STEPS = ['rating', 'difficulty', 'factors_diff', 'factors_fav', 'review_text'];
    const currentStep = STEPS[stepIndex];
    const progressPercentage = ((stepIndex + 1) / STEPS.length) * 100;

    let hasAnswer = false;
    if (currentStep === 'rating') {
        hasAnswer = review.overallRating > 0;
    } else if (currentStep === 'difficulty') {
        hasAnswer = (review.perceivedDifficulty && review.perceivedDifficulty !== 'undefined') && 
                    (review.trailMaintenance && review.trailMaintenance !== 'undefined');
    } else if (currentStep === 'factors_diff') {
        hasAnswer = review.difficultyFactors?.length > 0;
    } else if (currentStep === 'factors_fav') {
        hasAnswer = review.favoredFactors?.length > 0;
    } else if (currentStep === 'review_text') {
        hasAnswer = review.review?.trim().length > 0;
    }

    const handleNext = () => {
        if (!hasAnswer) return;
        if (stepIndex >= STEPS.length - 1) {
            setShowSaveConfirmation(true); 
        } else {
            setStepIndex(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (stepIndex > 0) {
            setStepIndex(prev => prev - 1);
        }
    };

    const updateReview = (field, value) => {
        onUpdatePress({ section: 'root', id: field, value });
    };

    const toggleArrayItem = (field, item) => {
        const currentArray = review[field] || [];
        const newArray = currentArray.includes(item) 
            ? currentArray.filter(i => i !== item)
            : [...currentArray, item];
        updateReview(field, newArray);
    };

    const SelectionPill = ({ label, selected, onPress }) => (
        <TouchableOpacity 
            style={[styles.pill, selected && styles.pillActive]} 
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.pillRow}>
                <View style={[styles.radioCircle, selected && styles.radioCircleActive]}>
                    {selected && <View style={styles.radioDot} />}
                </View>
                <CustomText style={[styles.pillText, selected && styles.pillTextActive]}>
                    {label}
                </CustomText>
            </View>
        </TouchableOpacity>
    );

    const renderStepContent = () => {
        switch (currentStep) {
            case 'rating':
                return (
                    <View style={styles.centerContent}>
                        <CustomText variant="subtitle" style={styles.question}>
                            How was your hike overall?
                        </CustomText>
                        <View style={styles.starContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity 
                                    key={star} 
                                    onPress={() => updateReview('overallRating', star)}
                                    activeOpacity={0.7}
                                    style={styles.starWrapper}
                                >
                                    <CustomIcon 
                                        library="Ionicons" 
                                        name={star <= review.overallRating ? "star" : "star-outline"} 
                                        size={48} 
                                        color={Colors.YELLOW} 
                                    />
                                    <CustomText style={styles.starLabel}>{star}</CustomText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 'difficulty':
                return (
                    <View>
                        <CustomText variant="subtitle" style={styles.question}>
                            How would you describe the trail difficulty?
                        </CustomText>
                        <View style={styles.faceContainer}>
                            {DIFFICULTY_LEVELS.map((diff) => {
                                const isSelected = review.perceivedDifficulty === diff.label;
                                return (
                                    <TouchableOpacity 
                                        key={diff.label} 
                                        onPress={() => updateReview('perceivedDifficulty', diff.label)}
                                        style={[styles.faceWrapper, isSelected && styles.faceWrapperActive]}
                                        activeOpacity={0.7}
                                    >
                                        <CustomIcon 
                                            library="MaterialCommunityIcons" 
                                            name={diff.icon} 
                                            size={42} 
                                            color={isSelected ? Colors.PRIMARY : Colors.GRAY_MEDIUM} 
                                        />
                                        <CustomText style={[styles.faceLabel, isSelected && styles.faceLabelActive]}>
                                            {diff.label}
                                        </CustomText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <CustomText variant="subtitle" style={[styles.question, { marginTop: 32 }]}>
                            Was the trail safe and easy to follow?
                        </CustomText>
                        <View style={styles.optionsWrapper}>
                            {MAINTENANCE_OPTIONS.map(opt => (
                                <SelectionPill 
                                    key={opt.value}
                                    label={opt.label}
                                    selected={review.trailMaintenance === opt.value}
                                    onPress={() => updateReview('trailMaintenance', opt.value)}
                                />
                            ))}
                        </View>
                    </View>
                );

            case 'factors_diff':
                return (
                    <View>
                        <CustomText variant="subtitle" style={styles.question}>
                            What affected the difficulty most?
                        </CustomText>
                        <CustomText variant="caption" style={styles.subLabel}>(Select all that apply)</CustomText>
                        
                        <View style={styles.optionsWrapper}>
                            {DIFFICULTY_FACTORS.map(opt => (
                                <SelectionPill 
                                    key={opt}
                                    label={opt}
                                    selected={(review.difficultyFactors || []).includes(opt)}
                                    onPress={() => toggleArrayItem('difficultyFactors', opt)}
                                />
                            ))}
                        </View>
                    </View>
                );

            case 'factors_fav':
                return (
                    <View>
                        <CustomText variant="subtitle" style={styles.question}>
                            What did you enjoy most?
                        </CustomText>
                        <CustomText variant="caption" style={styles.subLabel}>(Select all that apply)</CustomText>
                        
                        <View style={styles.optionsWrapper}>
                            {FAVORED_FACTORS.map(opt => (
                                <SelectionPill 
                                    key={opt}
                                    label={opt}
                                    selected={(review.favoredFactors || []).includes(opt)}
                                    onPress={() => toggleArrayItem('favoredFactors', opt)}
                                />
                            ))}
                        </View>
                    </View>
                );

            case 'review_text':
                return (
                    <View>
                        <CustomText variant="subtitle" style={styles.question}>
                            Write your thoughts or tips for other hikers
                        </CustomText>
                        <CustomFeedbackInput 
                            placeholder="Type your review here..."
                            value={review.review}
                            onChangeText={(val) => updateReview('review', val)}
                        />
                        
                        <View style={{ marginTop: 24 }}>
                            <CustomText variant="subtitle" style={[styles.question, { fontSize: 16 }]}>
                                Add a Photo (Optional)
                            </CustomText>
                            <DocumentUploadCard 
                                docName="Trail Photo"
                                docKey="reviewImage"
                                isUploaded={review.image && review.image.length > 0 ? review.image[0] : null}
                                onUploadSuccess={(url) => updateReview('image', [url])}
                            />
                        </View>
                    </View>
                );
        }
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <ConfirmationModal
                visible={showSaveConfirmation}
                title="Submit Review?"
                message="Thanks for sharing your thoughts! Your review helps other hikers and improves our trail recommendations."
                onConfirm={onSaveReview}
                onClose={() => setShowSaveConfirmation(false)}
                confirmText={isLoading ? "Submitting..." : "Submit"}
                cancelText="Edit"
            />
            
            <CustomHeader 
                title={review?.trail?.name ? `Review: ${review.trail.name}` : "How Was Your Hike?"} 
                centerTitle={true}
                onBackPress={onBackPress}
            />

            <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
            </View>

            <View style={styles.mainContainer}>
                <View style={styles.formConstrainer}>
                    
                    <View style={styles.fixedQuestionArea}>
                        <ErrorMessage error={error} />
                    </View>

                    <ScrollView 
                        style={styles.optionsScrollView}
                        contentContainerStyle={styles.optionsScrollContent}
                        showsVerticalScrollIndicator={false}
                        overScrollMode="never"
                        keyboardShouldPersistTaps="handled"
                    >
                        {renderStepContent()}
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
                            <CustomText style={styles.prevText}>Previous</CustomText>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.prevButtonPlaceholder} />
                    )}

                    <TouchableOpacity 
                        onPress={handleNext} 
                        disabled={!hasAnswer || isLoading}
                        style={[
                            styles.nextButton,
                            (!hasAnswer || isLoading) && { opacity: 0.5, backgroundColor: Colors.GRAY_MEDIUM } 
                        ]}
                    >
                        <CustomText style={styles.nextText}>
                            {stepIndex >= STEPS.length - 1 ? "Submit" : "Next"}
                        </CustomText>
                        
                        {stepIndex < STEPS.length - 1 && (
                            <CustomIcon 
                                library="Feather" 
                                name="chevron-right" 
                                size={24} 
                                color={Colors.TEXT_INVERSE} 
                            />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    progressBarBackground: {
        width: '100%',
        height: 4,
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
        maxWidth: 500, 
        alignSelf: 'center', 
        flex: 1, 
    },
    fixedQuestionArea: {
        paddingTop: 16,
    },
    optionsScrollView: {
        flex: 1,
    },
    optionsScrollContent: {
        paddingBottom: 40,
    },
    
    question: { 
        fontSize: 22, 
        fontWeight: 'bold', 
        marginBottom: 8, 
        color: Colors.TEXT_PRIMARY 
    },
    subLabel: { 
        fontStyle: 'italic', 
        marginBottom: 20, 
        color: Colors.TEXT_SECONDARY
    },

    centerContent: {
        alignItems: 'center',
        paddingTop: 24,
    },
    starContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginTop: 24,
    },
    starWrapper: {
        alignItems: 'center',
    },
    starLabel: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.TEXT_SECONDARY,
    },

    faceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingHorizontal: 8,
    },
    faceWrapper: {
        alignItems: 'center',
        padding: 8,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    faceWrapperActive: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderColor: Colors.PRIMARY,
    },
    faceLabel: {
        marginTop: 8,
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        fontWeight: '500',
    },
    faceLabelActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },

    optionsWrapper: { 
        width: '100%', 
        flexDirection: 'column',
        gap: 12,
    },
    pill: {
        backgroundColor: Colors.BACKGROUND,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    pillActive: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderColor: Colors.PRIMARY,
    },
    pillRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: Colors.GRAY_MEDIUM,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioCircleActive: {
        borderColor: Colors.PRIMARY,
    },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.PRIMARY,
    },
    pillText: {
        fontSize: 16,
        color: Colors.TEXT_PRIMARY,
        fontWeight: '500',
    },
    pillTextActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },

    footerContainer: {
        width: '100%',
        backgroundColor: Colors.BACKGROUND,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
    },
    footerConstrainer: {
        width: '100%',
        maxWidth: 500,
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

export default WriteReviewScreen;