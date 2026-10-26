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

import { DIFFICULTY_FACTOR_MAPPINGS, DifficultyFactorOption } from '@/src/recommendation/utilities/FactorWeightsMapper';

const DIFFICULTY_CARDS = [
    {
        label: 'Easy',
        subtitle: 'Gentle & comfortable pace',
        icon: 'smile',
        library: 'Feather' as const,
        activeColor: Colors.PRIMARY,
        activeBg: Colors.STATUS_APPROVED_BG,
    },
    {
        label: 'Difficult',
        subtitle: 'Strenuous & challenging climb',
        icon: 'trending-up',
        library: 'Feather' as const,
        activeColor: Colors.STATUS_WARNING_TEXT,
        activeBg: Colors.STATUS_WARNING_BG,
    },
];

export interface DraftReview {
    id?: string;
    overallRating: number;
    perceivedDifficulty?: string;
    trailMaintenance?: string;
    difficultyFactors?: string[];
    favoredFactors?: string[];
    review?: string;
    image?: string[];
    trail?: { name?: string };
}

export interface WriteReviewScreenProps {
    review: DraftReview;
    isLoading: boolean;
    error: string | null;
    onUpdatePress: (payload: { section: string; id: string; value: unknown }) => void;
    onSaveReview: () => void;
    onBackPress?: () => void;
}

const WriteReviewScreen: React.FC<WriteReviewScreenProps> = ({
    review,
    isLoading,
    error,
    onUpdatePress,
    onSaveReview,
    onBackPress,
}) => {
    const isEditMode = Boolean(review?.id);

    const [stepIndex, setStepIndex] = useState(0);
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const STEPS = ['ratings', 'details'];
    const currentStep = STEPS[stepIndex];
    const progressPercentage = ((stepIndex + 1) / STEPS.length) * 100;

    const normalizedDifficulty =
        review.perceivedDifficulty === 'Easy' || review.perceivedDifficulty === 'Just Right'
            ? 'Easy'
            : review.perceivedDifficulty === 'Difficult' || review.perceivedDifficulty === 'Moderate' || review.perceivedDifficulty === 'Hard' || review.perceivedDifficulty === 'Extreme'
                ? 'Difficult'
                : undefined;

    let hasAnswer = false;
    if (currentStep === 'ratings') {
        hasAnswer = review.overallRating > 0 && !!normalizedDifficulty;
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

    const handleDiscardPress = () => {
        if (!isDirty) {
            onBackPress?.();
            return;
        }
        setShowDiscardConfirmation(true);
    };

    const handleConfirmDiscard = () => {
        setShowDiscardConfirmation(false);
        onBackPress?.();
    };

    const updateReview = (field: string, value: unknown) => {
        setIsDirty(true);
        onUpdatePress({ section: 'root', id: field, value });
    };

    const toggleDifficultyFactor = (factor: DifficultyFactorOption, displayLabel: string) => {
        setIsDirty(true);
        const currentArray = ((review.difficultyFactors || []) as string[]);
        const isCurrentlySelected =
            currentArray.includes(displayLabel) ||
            currentArray.includes(factor.legacyLabel) ||
            currentArray.includes(factor.easyLabel) ||
            currentArray.includes(factor.difficultLabel);

        let updatedArray: string[];
        if (isCurrentlySelected) {
            updatedArray = currentArray.filter(
                item =>
                    item !== displayLabel &&
                    item !== factor.legacyLabel &&
                    item !== factor.easyLabel &&
                    item !== factor.difficultLabel
            );
        } else {
            const cleaned = currentArray.filter(
                item =>
                    item !== factor.legacyLabel &&
                    item !== factor.easyLabel &&
                    item !== factor.difficultLabel
            );
            updatedArray = [...cleaned, displayLabel];
        }
        updateReview('difficultyFactors', updatedArray);
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 'ratings':
                const showDifficulty = review.overallRating > 0;
                const showFactors = showDifficulty && !!normalizedDifficulty;

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
                                    How was the trail difficulty for you? <CustomText style={styles.requiredMark}>*</CustomText>
                                </CustomText>
                                <View style={styles.difficultyCardContainer}>
                                    {DIFFICULTY_CARDS.map((card) => {
                                        const isSelected = normalizedDifficulty === card.label;
                                        return (
                                            <TouchableOpacity
                                                key={card.label}
                                                onPress={() => {
                                                    if (normalizedDifficulty !== card.label) {
                                                        updateReview('perceivedDifficulty', card.label);
                                                        updateReview('difficultyFactors', []);
                                                    }
                                                }}
                                                style={[
                                                    styles.difficultyCard,
                                                    isSelected && {
                                                        borderColor: card.activeColor,
                                                        backgroundColor: card.activeBg,
                                                    }
                                                ]}
                                                activeOpacity={0.7}
                                            >
                                                <View style={[
                                                    styles.difficultyCardIconWrapper,
                                                    isSelected && { backgroundColor: Colors.WHITE }
                                                ]}>
                                                    <CustomIcon
                                                        library={card.library}
                                                        name={card.icon}
                                                        size={28}
                                                        color={isSelected ? card.activeColor : Colors.GRAY_MEDIUM}
                                                    />
                                                </View>
                                                <CustomText style={[
                                                    styles.difficultyCardTitle,
                                                    isSelected && { color: card.activeColor }
                                                ]}>
                                                    {card.label}
                                                </CustomText>
                                                <CustomText style={styles.difficultyCardSubtitle}>
                                                    {card.subtitle}
                                                </CustomText>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        )}

                        {showFactors && (
                            <View style={styles.sectionContainer}>
                                <CustomText variant="subtitle" style={styles.question}>
                                    {normalizedDifficulty === 'Easy'
                                        ? 'What made the trail easy?'
                                        : 'What made the trail difficult?'}
                                </CustomText>
                                <CustomText variant="caption" style={styles.subLabel}>
                                    (Select all factors that affected this difficulty)
                                </CustomText>

                                <View style={styles.chipWrapper}>
                                    {DIFFICULTY_FACTOR_MAPPINGS.map((factor) => {
                                        const displayLabel = normalizedDifficulty === 'Easy'
                                            ? factor.easyLabel
                                            : factor.difficultLabel;

                                        const currentFactors = (review.difficultyFactors || []) as string[];
                                        const isSelected =
                                            currentFactors.includes(displayLabel) ||
                                            currentFactors.includes(factor.legacyLabel) ||
                                            currentFactors.includes(factor.easyLabel) ||
                                            currentFactors.includes(factor.difficultLabel);

                                        return (
                                            <SelectionChip
                                                key={factor.id}
                                                label={displayLabel}
                                                selected={isSelected}
                                                variant={normalizedDifficulty === 'Difficult' ? 'warning' : 'primary'}
                                                onPress={() => toggleDifficultyFactor(factor, displayLabel)}
                                            />
                                        );
                                    })}
                                </View>
                            </View>
                        )}
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
                                value={review.review || ''}
                                onChangeText={(val) => updateReview('review', val)}
                            />

                            <View style={{ marginTop: 24 }}>
                                <CustomText variant="subtitle" style={[styles.question, { fontSize: 16 }]}>
                                    Add Photos (Optional)
                                </CustomText>
                                <DocumentUploadCard
                                    docName="Trail Photo"
                                    docKey="reviewImage"
                                    subtitle="Up to 5 photos • Max 5MB each"
                                    isUploaded={review.image || []}
                                    allowMultiple={true}
                                    maxFiles={5}
                                    onUploadSuccess={(url) => {
                                        const currentImages = review.image || [];
                                        if (currentImages.length < 5) {
                                            updateReview('image', [...currentImages, url]);
                                        }
                                    }}
                                    onBatchUploadSuccess={(urls) => {
                                        const currentImages = review.image || [];
                                        const combined = [...currentImages, ...urls].slice(0, 5);
                                        updateReview('image', combined);
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
                iconName="check-circle"
                onConfirm={onSaveReview}
                onClose={() => setShowSaveConfirmation(false)}
                confirmText={isLoading ? "Submitting..." : "Submit"}
                cancelText="Edit"
                isLoading={isLoading}
            />

            <ConfirmationModal
                visible={showDiscardConfirmation}
                title="Discard Changes?"
                message="You have unsaved changes. Are you sure you want to discard your edits?"
                iconName="alert-triangle"
                isDestructive={true}
                onConfirm={handleConfirmDiscard}
                onClose={() => setShowDiscardConfirmation(false)}
                confirmText="Discard"
                cancelText="Keep Editing"
            />

            <CustomHeader
                title={review?.trail?.name ? `Review: ${review.trail.name}` : "How Was Your Hike?"}
                centerTitle={true}
                onBackPress={handleDiscardPress}
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
                    ) : isEditMode ? (
                        <TouchableOpacity onPress={handleDiscardPress} style={styles.discardButton}>
                            <CustomText style={styles.discardText}>Discard</CustomText>
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

    difficultyCardContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    difficultyCard: {
        flex: 1,
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        paddingVertical: 18,
        paddingHorizontal: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.GRAY_ULTRALIGHT,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    difficultyCardIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        marginBottom: 10,
    },
    difficultyCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 4,
        textAlign: 'center',
    },
    difficultyCardSubtitle: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        textAlign: 'center',
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
    discardButton: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    discardText: {
        color: Colors.TEXT_SECONDARY,
        fontWeight: '600',
        fontSize: 16,
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
        borderRadius: 12,
        gap: 8,
    },
    nextText: {
        color: Colors.TEXT_INVERSE,
        fontWeight: 'bold',
        fontSize: 16
    },
});

export default WriteReviewScreen;