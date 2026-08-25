/**
 * @file useWebDragScroll.ts
 * @description Custom React hook to enable drag-to-scroll functionality using mouse events on Web platforms for React Native's ScrollView, featuring capture-phase click interception to prevent parent event bubbling during drags.
 */

import { RefObject, useEffect } from 'react';
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
        let hasDragged = false;

        const handleMouseDown = (e: MouseEvent) => {
            isDown = true;
            hasDragged = false;
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
            const x = e.pageX - scrollNode.offsetLeft;
            const distance = Math.abs(x - startX);
            if (distance > 5) {
                hasDragged = true;
            }
            e.preventDefault();
            const walk = (x - startX) * 1.5;
            scrollNode.scrollLeft = scrollLeft - walk;
        };

        const handleClick = (e: MouseEvent) => {
            if (hasDragged) {
                e.stopPropagation();
                e.preventDefault();
                hasDragged = false;
            }
        };

        scrollNode.style.cursor = 'grab';
        scrollNode.addEventListener('mousedown', handleMouseDown);
        scrollNode.addEventListener('mouseleave', handleMouseLeave);
        scrollNode.addEventListener('mouseup', handleMouseUp);
        scrollNode.addEventListener('mousemove', handleMouseMove);
        // Intercept clicks in capture phase to prevent bubbling to parent card elements
        scrollNode.addEventListener('click', handleClick, true);

        return () => {
            scrollNode.removeEventListener('mousedown', handleMouseDown);
            scrollNode.removeEventListener('mouseleave', handleMouseLeave);
            scrollNode.removeEventListener('mouseup', handleMouseUp);
            scrollNode.removeEventListener('mousemove', handleMouseMove);
            scrollNode.removeEventListener('click', handleClick, true);
        };
    }, [scrollRef, enabled]);
}
