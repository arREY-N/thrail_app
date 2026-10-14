/**
 * @file useCommunity.ts
 * @description Hook managing community feed queries, filtering, sorting, and progressive 5-by-5 pagination logic.
 */

import { Review } from '@/src/core/models/Review/Review';
import { useCallback, useMemo, useState } from 'react';

const INITIAL_PAGE_SIZE = 5;
const PAGE_INCREMENT = 5;

/**
 * Custom hook to manage the state and logic for the Community feed.
 * Handles searching, tab selection (Latest, Popular, Rating), and progressive 5-by-5 pagination.
 * 
 * @param reviews - The raw array of reviews fetched from the store/database.
 * @returns An object containing the current state variables, paginated reviews, and pagination controls.
 */
export const useCommunity = (reviews: Review[]) => {
    const [activeTab, setActiveTab] = useState('Latest');
    const [searchQuery, setSearchQuery] = useState('');
    const [displayedCount, setDisplayedCount] = useState<number>(INITIAL_PAGE_SIZE);
    const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);

    // Reset pagination when active tab or search query changes
    const handleTabChange = useCallback((tab: string) => {
        setActiveTab(tab);
        setDisplayedCount(INITIAL_PAGE_SIZE);
    }, []);

    const handleSearchChange = useCallback((query: string) => {
        setSearchQuery(query);
        setDisplayedCount(INITIAL_PAGE_SIZE);
    }, []);

    // Filtering & Sorting Logic
    const sortedAndFilteredReviews = useMemo(() => {
        if (!reviews) return [];

        let filtered = [...reviews];

        // 1. SEARCHING (relying on CustomSearchBar's debounced searchQuery prop updates)
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase().trim();
            
            filtered = filtered.filter(r => {
                const reviewText = String(r.review || '').toLowerCase();
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
                const dateA = new Date(a.createdAt || a.hikeDate).getTime() || 0;
                const dateB = new Date(b.createdAt || b.hikeDate).getTime() || 0;
                return dateB - dateA; 
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

    const paginatedReviews = useMemo(() => {
        return sortedAndFilteredReviews.slice(0, displayedCount);
    }, [sortedAndFilteredReviews, displayedCount]);

    const hasMore = displayedCount < sortedAndFilteredReviews.length;

    const handleLoadMore = useCallback(() => {
        if (isFetchingMore || displayedCount >= sortedAndFilteredReviews.length) return;

        setIsFetchingMore(true);
        setTimeout(() => {
            setDisplayedCount(prev => prev + PAGE_INCREMENT);
            setIsFetchingMore(false);
        }, 600);
    }, [isFetchingMore, displayedCount, sortedAndFilteredReviews.length]);

    const resetPagination = useCallback(() => {
        setDisplayedCount(INITIAL_PAGE_SIZE);
        setIsFetchingMore(false);
    }, []);

    return {
        searchQuery,
        setSearchQuery: handleSearchChange,
        activeTab,
        setActiveTab: handleTabChange,
        filteredReviews: sortedAndFilteredReviews,
        paginatedReviews,
        hasMore,
        isFetchingMore,
        handleLoadMore,
        resetPagination,
    };
};
