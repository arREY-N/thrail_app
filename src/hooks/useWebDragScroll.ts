/**
 * @file useWebDragScroll.ts
 * @description Custom React hook to enable drag-to-scroll functionality using mouse events on Web platforms for React Native's ScrollView.
 */

import { useEffect, RefObject } from 'react';
import { Platform, ScrollView } from 'react-native';

/**
 * Custom React hook to enable drag-to-scroll functionality using mouse events
 * on Web platforms for React Native's ScrollView.
 * 
 * @param scrollRef - React Ref object pointing to the ScrollView.
 * @param enabled - Flag to enable or disable the hook functionality.
 */
export function useWebDragScroll(scrollRef: RefObject<ScrollView | null>, enabled: boolean = true) {
    useEffect(() => {
        if (Platform.OS !== 'web' || !enabled) return;

        const scrollNode = scrollRef.current?.getScrollableNode() as HTMLElement;
        if (!scrollNode) return;

        let isDown = false;
        let startX = 0;
        let scrollLeft = 0;

        const handleMouseDown = (e: MouseEvent) => {
            isDown = true;
            startX = e.pageX - scrollNode.offsetLeft;
            scrollLeft = scrollNode.scrollLeft;
            scrollNode.style.cursor = 'grabbing';
            scrollNode.style.userSelect = 'none';
        };

        const handleMouseLeave = () => {
            isDown = false;
            scrollNode.style.cursor = 'grab';
        };

        const handleMouseUp = () => {
            isDown = false;
            scrollNode.style.cursor = 'grab';
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - scrollNode.offsetLeft;
            const walk = (x - startX) * 1.5;
            scrollNode.scrollLeft = scrollLeft - walk;
        };

        scrollNode.style.cursor = 'grab';
        scrollNode.addEventListener('mousedown', handleMouseDown);
        scrollNode.addEventListener('mouseleave', handleMouseLeave);
        scrollNode.addEventListener('mouseup', handleMouseUp);
        scrollNode.addEventListener('mousemove', handleMouseMove);

        return () => {
            scrollNode.removeEventListener('mousedown', handleMouseDown);
            scrollNode.removeEventListener('mouseleave', handleMouseLeave);
            scrollNode.removeEventListener('mouseup', handleMouseUp);
            scrollNode.removeEventListener('mousemove', handleMouseMove);
        };
    }, [scrollRef, enabled]);
}
