import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
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
import SelectionChip from '@/src/features/Auth/components/SelectionChip';
import SelectionOption from '@/src/features/Auth/components/SelectionOption';

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
    onSaveReview
}) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const [touchedMaintenance, setTouchedMaintenance] = useState(false); 

    const STEPS = ['ratings', 'factors', 'details'];
    const currentStep = STEPS[stepIndex];
    const progressPercentage = ((stepIndex + 1) / STEPS.length) * 100;

    let hasAnswer = false;
    if (currentStep === 'ratings') {
        hasAnswer = 
            review.overallRating > 0 && 
            (review.perceivedDifficulty && review.perceivedDifficulty !== 'undefined') &&
            (review.trailMaintenance && review.trailMaintenance !== 'undefined') &&
            touchedMaintenance; 
    } else if (currentStep === 'factors') {
        hasAnswer = true;
    } else if (currentStep === 'details') {
        hasAnswer = true;
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

    const renderStepContent = () => {
        switch (currentStep) {
            case 'ratings':
                const showDifficulty = review.overallRating > 0;
                const showMaintenance = showDifficulty && (review.perceivedDifficulty && review.perceivedDifficulty !== 'undefined');

                return (
                    <View>
                        <View style={styles.sectionContainer}>
                            <CustomText variant="subtitle" style={styles.question}>
                                How was your hike overall? <CustomText style={styles.requiredMark}>*</CustomText>
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

                        {showDifficulty && (
                            <View style={styles.sectionContainer}>
                                <CustomText variant="subtitle" style={styles.question}>
                                    How would you describe the trail difficulty? <CustomText style={styles.requiredMark}>*</CustomText>
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
                            </View>
                        )}

                        {showMaintenance && (
                            <View style={styles.sectionContainer}>
                                <CustomText variant="subtitle" style={styles.question}>
                                    Was the trail safe and easy to follow? <CustomText style={styles.requiredMark}>*</CustomText>
                                </CustomText>
                                <View style={styles.optionsWrapper}>
                                    {MAINTENANCE_OPTIONS.map(opt => (
                                        <SelectionOption 
                                            key={opt.value}
                                            label={opt.label}
                                            selected={touchedMaintenance && review.trailMaintenance === opt.value}
                                            onPress={() => {
                                                setTouchedMaintenance(true);
                                                updateReview('trailMaintenance', opt.value);
                                            }}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                );

            case 'factors':
                return (
                    <View>
                        <View style={styles.sectionContainer}>
                            <CustomText variant="subtitle" style={styles.question}>
                                What affected the difficulty most?
                            </CustomText>
                            <CustomText variant="caption" style={styles.subLabel}>(Select all that apply)</CustomText>
                            
                            <View style={styles.chipWrapper}>
                                {DIFFICULTY_FACTORS.map(opt => (
                                    <SelectionChip 
                                        key={opt}
                                        label={opt}
                                        selected={(review.difficultyFactors || []).includes(opt)}
                                        onPress={() => toggleArrayItem('difficultyFactors', opt)}
                                    />
                                ))}
                            </View>
                        </View>

                        <View style={[styles.sectionContainer]}>
                            <CustomText variant="subtitle" style={styles.question}>
                                What did you enjoy most?
                            </CustomText>
                            <CustomText variant="caption" style={styles.subLabel}>(Select all that apply)</CustomText>
                            
                            <View style={styles.chipWrapper}>
                                {FAVORED_FACTORS.map(opt => (
                                    <SelectionChip 
                                        key={opt}
                                        label={opt}
                                        selected={(review.favoredFactors || []).includes(opt)}
                                        onPress={() => toggleArrayItem('favoredFactors', opt)}
                                    />
                                ))}
                            </View>
                        </View>
                    </View>
                );

            case 'details':
                return (
                    <View>
                        <View style={styles.sectionContainer}>
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
                                    isUploaded={review.image || []}
                                    allowMultiple={true}
                                    onUploadSuccess={(url) => {
                                        const currentImages = review.image || [];
                                        updateReview('image', [...currentImages, url]);
                                    }}
                                    onDelete={(indexToRemove) => {
                                        const currentImages = review.image || [];
                                        const updatedImages = currentImages.filter((_, idx) => idx !== indexToRemove);
                                        updateReview('image', updatedImages);
                                    }}
                                />
                            </View>
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
        paddingTop: 8,
    },
    optionsScrollView: {
        flex: 1,
    },
    optionsScrollContent: {
        paddingBottom: 40,
    },
    
    sectionContainer: {
        marginBottom: 32,
    },

    question: { 
        fontSize: 22, 
        fontWeight: 'bold', 
        marginBottom: 8, 
        color: Colors.TEXT_PRIMARY,
        textAlign: 'left' 
    },
    requiredMark: {
        color: Colors.ERROR,
        fontSize: 22,
    },
    subLabel: { 
        fontStyle: 'italic', 
        marginBottom: 16, 
        color: Colors.TEXT_SECONDARY,
        textAlign: 'left'
    },

    starContainer: {
        flexDirection: 'row',
        justifyContent: 'center', 
        gap: 12,
        marginTop: 16,
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
        gap: 4, 
    },
    faceWrapper: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 2,
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
        textAlign: 'center',
    },
    faceLabelActive: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        textAlign: 'center',
    },

    optionsWrapper: { 
        width: '100%', 
        flexDirection: 'column',
        marginTop: 8,
    },
    
    chipWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap', 
        gap: 10, 
        marginTop: 8,
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