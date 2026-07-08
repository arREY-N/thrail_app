/**
 * @file useCommunity.ts
 * @description Hook managing community feed queries, filtering and sorting logic.
 */

import { Review } from '@/src/core/models/Review/Review';
import { useMemo, useState } from 'react';

/**
 * Custom hook to manage the state and logic for the Community feed.
 * Handles searching and tab selection (Latest or Popular) for reviews.
 * 
 * @param reviews - The raw array of reviews fetched from the store/database.
 * @returns An object containing the current state variables and the filtered/sorted reviews.
 */
export const useCommunity = (reviews: Review[]) => {
    const [activeTab, setActiveTab] = useState('Latest');
    const [searchQuery, setSearchQuery] = useState('');

    // Filtering & Sorting Logic
    const sortedAndFilteredReviews = useMemo(() => {
        if (!reviews) return [];

        let filtered = [...reviews];

        // 1. SEARCHING (relying on CustomSearchBar's debounced searchQuery prop updates)
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase().trim();
            
            filtered = filtered.filter(r => {
                const reviewText = String(r.review || r.content || '').toLowerCase();
                const userText = String(r.user?.username || r.user?.firstname || '').toLowerCase();
                const mountainText = String(r.trail?.name || '').toLowerCase();
                const locationText = String(r.trail?.location || '').toLowerCase();

                return reviewText.includes(query) || 
                       userText.includes(query) || 
                       mountainText.includes(query) || 
                       locationText.includes(query);
            });
        }
        
        // 2. SORTING/FILTERING (Defaulting to descending order: Latest first or Popular first)
        if (activeTab === 'Popular') {
            filtered.sort((a, b) => {
                const aLikes = Array.isArray(a.likes) ? a.likes.length : (Number(a.likes) || 0);
                const bLikes = Array.isArray(b.likes) ? b.likes.length : (Number(b.likes) || 0);
                return bLikes - aLikes;
            });
        } else if (activeTab === 'Latest') {
            filtered.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.hikeDate).getTime();
                const dateB = new Date(b.createdAt || b.hikeDate).getTime();
                return (dateB || 0) - (dateA || 0); 
            });
        } else if (activeTab === 'Rating') {
            filtered.sort((a, b) => {
                const aRating = Number(a.overallRating) || 0;
                const bRating = Number(b.overallRating) || 0;
                return bRating - aRating;
            });
        }

        return filtered;
    }, [reviews, activeTab, searchQuery]);

    return {
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        filteredReviews: sortedAndFilteredReviews
    };
};
