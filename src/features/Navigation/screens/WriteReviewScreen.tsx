import React, { useState } from 'react';
import {
    Platform,
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
import CustomToast from '@/src/components/CustomToast';
import DocumentUploadCard from '@/src/components/DocumentUploadCard';
import ErrorMessage from '@/src/components/ErrorMessage';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import {
    CustomTutorialModal,
    TutorialHelpButton,
    useWriteReviewTutorial,
} from '@/src/components/Tutorial/Tutorial';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import SelectionChip from '@/src/features/Auth/components/SelectionChip';

import { BusinessReviewData } from '@/src/core/flows/CreateReviewFlow';
import { DIFFICULTY_FACTOR_MAPPINGS, DifficultyFactorOption } from '@/src/recommendation/utilities/FactorWeightsMapper';
import { getInitials } from '@/src/utils/dateFormatter';

const ORGANIZER_REVIEW_SUGGESTIONS = [
    'Well-organized itinerary and pacing',
    'Friendly and knowledgeable guides',
    'Clear pre-hike communication',
    'Strong focus on hiker safety',
    'Punctual meetup and smooth logistics',
    'Great value for the package price',
];

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
    bookingId?: string | null;
}

export interface WriteReviewScreenProps {
    review: DraftReview;
    existingBusinessReview?: BusinessReviewData | null;
    organizerName?: string;
    canReviewOrganizer?: boolean;
    isLoading: boolean;
    error: string | null;
    onUpdatePress: (payload: { section: string; id: string; value: unknown }) => void;
    onSaveReview: () => void | Promise<boolean | void>;
    onBackPress?: () => void;
    createBusinessReview?: (data: BusinessReviewData) => Promise<void>;
}

const WriteReviewScreen: React.FC<WriteReviewScreenProps> = ({
    review,
    existingBusinessReview,
    organizerName,
    canReviewOrganizer,
    isLoading,
    error,
    onUpdatePress,
    onSaveReview,
    onBackPress,
    createBusinessReview,
}) => {
    const isEditMode = Boolean(review?.id);

    const [stepIndex, setStepIndex] = useState(0);
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isSubmittingBusiness, setIsSubmittingBusiness] = useState(false);
    const [isSavingReview, setIsSavingReview] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [validationToast, setValidationToast] = useState<string | null>(null);
    const [toastTriggerKey, setToastTriggerKey] = useState(0);
    const [footerHeight, setFooterHeight] = useState(88);
    const [prevExistingBusinessReview, setPrevExistingBusinessReview] = useState<BusinessReviewData | null | undefined>(
        existingBusinessReview
    );
    const [businessRating, setBusinessRating] = useState<number>(existingBusinessReview?.rating ?? 0);
    const [businessReview, setBusinessReview] = useState<string>(existingBusinessReview?.review ?? '');

    if (existingBusinessReview !== prevExistingBusinessReview) {
        setPrevExistingBusinessReview(existingBusinessReview);
        if (existingBusinessReview && !isDirty) {
            setBusinessRating(existingBusinessReview.rating ?? 0);
            setBusinessReview(existingBusinessReview.review ?? '');
        }
    }

    const hasBooking = review?.bookingId != null && review.bookingId !== '';
    const showOrganizerStep = hasBooking && canReviewOrganizer !== false;
    const hasExistingOrganizerReview = Boolean(existingBusinessReview);
    const STEPS = showOrganizerStep ? ['ratings', 'details', 'organizer'] : ['ratings', 'details'];
    const safeStepIndex = Math.min(stepIndex, STEPS.length - 1);
    const currentStep = STEPS[safeStepIndex];
    const progressPercentage = ((safeStepIndex + 1) / STEPS.length) * 100;
    const isSubmitting = isLoading || isSubmittingBusiness || isSavingReview;

    const {
        tutorial,
        starRatingRef,
        nextBtnRef,
        feedbackInputRef,
        photoUploadRef,
        submitBtnRef,
        organizerRatingRef,
        organizerFeedbackRef,
        handlers,
    } = useWriteReviewTutorial({
        isEditMode,
        stepIndex: safeStepIndex,
        isLoading,
        hasOrganizerStep: showOrganizerStep,
    });

    const isBusinessEmpty = businessRating === 0 && businessReview.trim().length === 0;
    const isBusinessComplete = businessRating > 0 && businessReview.trim().length > 0;
    const isLastStep = safeStepIndex >= STEPS.length - 1;
    const isSkipSubmitState =
        currentStep === 'organizer' &&
        isBusinessEmpty &&
        !hasExistingOrganizerReview;

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
    } else if (currentStep === 'organizer') {
        hasAnswer = hasExistingOrganizerReview
            ? isBusinessComplete
            : (isBusinessEmpty || isBusinessComplete);
    }

    const getIncompleteStepMessage = (): string => {
        if (currentStep === 'ratings') {
            if (review.overallRating <= 0) {
                return 'Please select an overall star rating for your hike.';
            }
            if (!normalizedDifficulty) {
                return 'Please select how difficult the trail felt for you.';
            }
        }
        if (currentStep === 'organizer') {
            if (businessRating > 0 && businessReview.trim().length === 0) {
                return hasExistingOrganizerReview
                    ? 'Please write a short review for the organizer.'
                    : 'Please write a short review for the organizer, or tap the selected star again to skip.';
            }
            if (businessRating === 0 && businessReview.trim().length > 0) {
                return hasExistingOrganizerReview
                    ? 'Please select a star rating for the organizer.'
                    : 'Please select a star rating for the organizer, or clear your text to skip.';
            }
            if (hasExistingOrganizerReview) {
                return 'Please provide both a star rating and a review for the organizer.';
            }
        }
        return 'Please complete the required fields to continue.';
    };

    const handleNext = () => {
        if (!hasAnswer) {
            setValidationToast(getIncompleteStepMessage());
            setToastTriggerKey(prev => prev + 1);
            return;
        }
        setValidationToast(null);
        setSubmitError(null);
        if (safeStepIndex >= STEPS.length - 1) {
            setShowSaveConfirmation(true);
        } else {
            setStepIndex(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setValidationToast(null);
        setSubmitError(null);
        if (safeStepIndex > 0) {
            setStepIndex(safeStepIndex - 1);
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

    const handleBusinessStarPress = (star: number) => {
        setIsDirty(true);
        setSubmitError(null);
        setBusinessRating((prev) => (!hasExistingOrganizerReview && prev === star ? 0 : star));
    };

    const handleConfirmSubmit = async () => {
        if (isSubmitting) return;
        setSubmitError(null);
        setValidationToast(null);

        const shouldSubmitBusinessReview =
            showOrganizerStep &&
            isBusinessComplete &&
            Boolean(createBusinessReview);

        if (shouldSubmitBusinessReview && createBusinessReview) {
            setIsSubmittingBusiness(true);
            try {
                await createBusinessReview({
                    rating: businessRating,
                    review: businessReview.trim(),
                });
            } catch (err: unknown) {
                const message = err instanceof Error
                    ? err.message
                    : 'Failed to submit organizer review. Please try again.';
                setSubmitError(message);
                setShowSaveConfirmation(false);
                return;
            } finally {
                setIsSubmittingBusiness(false);
            }
        }

        setIsSavingReview(true);
        try {
            const saved = await onSaveReview();
            if (saved === false) {
                setValidationToast('Failed to save review. Please check your connection and try again.');
                setToastTriggerKey(prev => prev + 1);
            }
        } catch (err: unknown) {
            const message = err instanceof Error
                ? err.message
                : 'Failed to save review. Please try again.';
            setSubmitError(message);
        } finally {
            setIsSavingReview(false);
            setShowSaveConfirmation(false);
        }
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
                            <View
                                ref={starRatingRef}
                                collapsable={false}
                                onLayout={handlers.handleStarRatingLayout}
                                style={styles.starContainer}
                            >
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
                            <View
                                ref={feedbackInputRef}
                                collapsable={false}
                                onLayout={handlers.handleFeedbackInputLayout}
                            >
                                <CustomFeedbackInput
                                    placeholder="Type your review here..."
                                    value={review.review || ''}
                                    onChangeText={(val) => updateReview('review', val)}
                                />
                            </View>

                            <View
                                ref={photoUploadRef}
                                collapsable={false}
                                onLayout={handlers.handlePhotoUploadLayout}
                                style={styles.photoSectionContainer}
                            >
                                <CustomText variant="h3" style={styles.subSectionTitle}>
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

            case 'organizer': {
                const organizerInitials = getInitials(organizerName);

                return (
                    <View>
                        {/* Organizer Context Banner Card */}
                        <View style={styles.organizerCard}>
                            <View style={styles.organizerAvatarCircle}>
                                <CustomText style={styles.organizerInitialsText}>
                                    {organizerInitials}
                                </CustomText>
                            </View>

                            <View style={styles.organizerTextGroup}>
                                <CustomText variant="label" style={styles.organizerLabel}>
                                    Rate your organizer
                                </CustomText>
                                <CustomText
                                    variant="h3"
                                    style={styles.organizerName}
                                    numberOfLines={1}
                                >
                                    {organizerName?.trim() || '--'}
                                </CustomText>
                            </View>

                            {!hasExistingOrganizerReview && (
                                <View style={styles.optionalBadge}>
                                    <CustomText variant="caption" style={styles.optionalBadgeText}>
                                        Optional
                                    </CustomText>
                                </View>
                            )}
                        </View>

                        {/* Organizer Star Rating */}
                        <View style={styles.sectionContainer}>
                            <CustomText variant="subtitle" style={styles.question}>
                                How was your experience with the organizer?
                                {hasExistingOrganizerReview && (
                                    <CustomText style={styles.requiredMark}>
                                        {' *'}
                                    </CustomText>
                                )}
                            </CustomText>

                            <View
                                ref={organizerRatingRef}
                                collapsable={false}
                                onLayout={handlers.handleOrganizerRatingLayout}
                                style={styles.starContainer}
                            >
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity
                                        key={star}
                                        onPress={() => handleBusinessStarPress(star)}
                                        activeOpacity={0.7}
                                        style={styles.starWrapper}
                                    >
                                        <CustomIcon
                                            library="Ionicons"
                                            name={star <= businessRating ? "star" : "star-outline"}
                                            size={48}
                                            color={Colors.YELLOW}
                                        />
                                        <CustomText style={styles.starLabel}>
                                            {star}
                                        </CustomText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Organizer Feedback + Suggestion Chips */}
                        <View style={styles.sectionContainer}>
                            <CustomText variant="h3" style={styles.subSectionTitle}>
                                Share your experience with the organizer
                            </CustomText>
                            <View
                                ref={organizerFeedbackRef}
                                collapsable={false}
                                onLayout={handlers.handleOrganizerFeedbackLayout}
                            >
                                <CustomFeedbackInput
                                    placeholder="Type your review here..."
                                    value={businessReview}
                                    suggestions={ORGANIZER_REVIEW_SUGGESTIONS}
                                    fadeColor="background"
                                    onChangeText={(val) => {
                                        setIsDirty(true);
                                        setSubmitError(null);
                                        setBusinessReview(val);
                                    }}
                                />
                            </View>
                        </View>
                    </View>
                );
            }
        }
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>

            <ConfirmationModal
                visible={showSaveConfirmation}
                title="Submit Review?"
                message="Thanks for sharing your thoughts! Your review helps other hikers and improves our trail recommendations."
                iconName="check-circle"
                onConfirm={handleConfirmSubmit}
                onClose={() => {
                    if (!isSubmitting) {
                        setShowSaveConfirmation(false);
                    }
                }}
                confirmText={isSubmitting ? "Submitting..." : "Submit"}
                cancelText="Edit"
                isLoading={isSubmitting}
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
                rightActions={
                    <TutorialHelpButton
                        onPress={tutorial.onReplayTour}
                        hasGuide={tutorial.hasGuide}
                    />
                }
            />

            <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
            </View>

            <View style={styles.mainContainer}>
                <View style={styles.formConstrainer}>

                    <View style={styles.fixedQuestionArea}>
                        <ErrorMessage error={submitError || error} />
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

            <View
                style={styles.footerContainer}
                onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
            >
                <View style={styles.footerConstrainer}>
                    {safeStepIndex > 0 ? (
                        <TouchableOpacity onPress={handleBack} disabled={isSubmitting} style={styles.prevButton}>
                            <CustomIcon
                                library="Feather"
                                name="chevron-left"
                                size={24}
                                color={Colors.TEXT_SECONDARY}
                            />
                            <CustomText style={styles.prevText}>Previous</CustomText>
                        </TouchableOpacity>
                    ) : isEditMode ? (
                        <TouchableOpacity onPress={handleDiscardPress} disabled={isSubmitting} style={styles.discardButton}>
                            <CustomText style={styles.discardText}>Discard</CustomText>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.prevButtonPlaceholder} />
                    )}

                    <View
                        ref={!isLastStep ? nextBtnRef : submitBtnRef}
                        collapsable={false}
                        onLayout={!isLastStep ? handlers.handleNextBtnLayout : handlers.handleSubmitBtnLayout}
                    >
                        <TouchableOpacity
                            onPress={handleNext}
                            disabled={isSubmitting}
                            style={[
                                styles.nextButton,
                                isSkipSubmitState && styles.skipSubmitButton,
                                (!hasAnswer || isSubmitting) && styles.nextButtonDisabled,
                            ]}
                        >
                            <CustomText
                                style={[
                                    styles.nextText,
                                    isSkipSubmitState && styles.skipSubmitText,
                                ]}
                            >
                                {isLastStep
                                    ? (isSubmitting ? 'Submitting...' : (isSkipSubmitState ? 'Skip & Submit' : 'Submit'))
                                    : 'Next'}
                            </CustomText>

                            {!isLastStep && (
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
            </View>

            {Platform.OS !== 'web' && !isEditMode && (
                <CustomTutorialModal
                    visible={tutorial.isVisible}
                    tourConfig={tutorial.tourConfig}
                    currentStep={tutorial.currentStep}
                    currentStepIndex={tutorial.currentStepIndex}
                    totalSteps={tutorial.totalSteps}
                    onNext={tutorial.onNextStep}
                    onPrev={tutorial.onPrevStep}
                    onSkip={tutorial.onSkipTour}
                />
            )}

            <CustomToast
                visible={Boolean(validationToast)}
                message={validationToast || ''}
                type="error"
                mode="dismissible"
                bottomOffset={footerHeight + 12}
                triggerKey={toastTriggerKey}
                onHide={() => setValidationToast(null)}
            />

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
        marginBottom: -4,
    },
    optionsScrollView: {
        flex: 1,
    },
    optionsScrollContent: {
        paddingTop: 16,
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
    subSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        color: Colors.TEXT_PRIMARY,
        textAlign: 'left',
    },
    photoSectionContainer: {
        marginTop: 24,
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
        ...GlobalStyles.dropShadow(2, 0.05, Colors.SHADOW, { radius: 4 }),
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
        gap: 12,
    },
    prevButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        flexShrink: 0,
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
        borderWidth: 1.5,
        borderColor: Colors.PRIMARY,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
        flexShrink: 1,
        ...Platform.select({
            web: {
                cursor: 'pointer',
            },
        }),
    },
    nextButtonDisabled: {
        opacity: 0.5,
        backgroundColor: Colors.GRAY_MEDIUM,
        borderColor: Colors.GRAY_MEDIUM,
    },
    skipSubmitButton: {
        backgroundColor: Colors.BUTTON_OUTLINE_BG,
        borderColor: Colors.PRIMARY,
    },
    nextText: {
        color: Colors.TEXT_INVERSE,
        fontWeight: 'bold',
        fontSize: 16
    },
    skipSubmitText: {
        color: Colors.PRIMARY,
    },
    organizerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.WHITE,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        padding: 16,
        marginBottom: 24,
        gap: 12,
        ...GlobalStyles.dropShadow(2, 0.05, Colors.SHADOW, { radius: 8 }),
        elevation: 2,
    },
    organizerAvatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    organizerInitialsText: {
        color: Colors.WHITE,
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    organizerTextGroup: {
        flex: 1,
        minWidth: 0,
    },
    organizerLabel: {
        fontSize: 12,
        color: Colors.TEXT_SECONDARY,
        marginBottom: 2,
    },
    organizerName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 0,
    },
    optionalBadge: {
        backgroundColor: Colors.STATUS_APPROVED_BG,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    optionalBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.PRIMARY,
    },
});

export default WriteReviewScreen;