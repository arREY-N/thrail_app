/**
 * @file index.tsx
 * @description Controller for the Help & Support settings page, managing FAQs and user feedback submission.
 */
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';
import HelpSupportScreen from '@/src/features/Settings/screens/HelpSupportScreen';
import React from 'react';

/**
 * HelpSupportPage coordinates FAQs and support request submissions.
 */
export default function help() {
    const { onBackPress } = useAppNavigation();
    
    // TODO: [Backend] Handle fetching FAQs from Firestore
    const faqs = [
        { q: "How do I download offline maps?", a: "Offline maps are downloaded automatically when you view a trail's details while connected to the internet." },
        { q: "How do I become a verified guide?", a: "Go to Settings > Apply for Business Account to submit your requirements." }
    ];

    const handleSubmitRequest = (message: string) => {
        // TODO: [Backend] Handle sending support message to database/email
    };

    return (
        <HelpSupportScreen 
            faqs={faqs}
            onSubmitRequest={handleSubmitRequest}
            onBackPress={onBackPress}
        />
    );
}
