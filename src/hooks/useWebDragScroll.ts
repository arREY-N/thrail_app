/**
 * @file useWebDragScroll.ts
 * @description Custom React hook to enable drag-to-scroll functionality using mouse events on Web platforms for React Native's ScrollView, featuring capture-phase click interception and HTML5 dragstart suppression to prevent image dragging.
 */

import { RefObject, useEffect } from 'react';
import { Platform, ScrollView } from 'react-native';

interface ScrollableNodeHolder {
    getScrollableNode?: () => HTMLElement;
}

const getScrollNode = (ref: ScrollView | null): HTMLElement | null => {
    if (!ref) return null;
    const holder = ref as unknown as ScrollableNodeHolder;
    if (typeof holder.getScrollableNode === 'function') {
        const node = holder.getScrollableNode();
        if (node && typeof (node as unknown as HTMLElement).addEventListener === 'function') {
            return node as unknown as HTMLElement;
        }
    }
    if (typeof (ref as unknown as HTMLElement).addEventListener === 'function') {
        return ref as unknown as HTMLElement;
    }
    return null;
};

/**
 * Custom React hook to enable drag-to-scroll functionality using mouse events
 * on Web platforms for React Native's ScrollView.
 * 
 * @param scrollRef - React Ref object pointing to the ScrollView.
 * @param enabled - Flag to enable or disable the hook functionality.
 * @param dependency - Optional trigger value (e.g. data or item count) to re-evaluate ref binding.
 */
export function useWebDragScroll(
    scrollRef: RefObject<ScrollView | null>,
    enabled: boolean = true,
    dependency?: unknown
) {
    useEffect(() => {
        if (Platform.OS !== 'web' || !enabled) return;

        let cleanup: (() => void) | undefined;
        let rafId: number | null = null;

        const bind = (node: HTMLElement) => {
            let isDown = false;
            let startX = 0;
            let scrollLeft = 0;
            let hasDragged = false;
            let isListeningWindow = false;

            const handleMouseUp = () => {
                if (!isDown && !isListeningWindow) return;
                isDown = false;
                if (isListeningWindow) {
                    window.removeEventListener('mouseup', handleMouseUp);
                    window.removeEventListener('mousemove', handleMouseMove);
                    isListeningWindow = false;
                }
                node.style.cursor = 'grab';
                node.style.removeProperty('user-select');
            };

            const handleMouseMove = (e: MouseEvent) => {
                if (!isDown) return;
                if (e.buttons !== 1) {
                    handleMouseUp();
                    return;
                }
                const x = e.pageX - node.offsetLeft;
                const distance = Math.abs(x - startX);
                if (distance > 5) {
                    hasDragged = true;
                }
                e.preventDefault();
                const walk = (x - startX) * 1.5;
                node.scrollLeft = scrollLeft - walk;
            };

            const handleMouseDown = (e: MouseEvent) => {
                if (e.button !== 0) return;
                isDown = true;
                hasDragged = false;
                startX = e.pageX - node.offsetLeft;
                scrollLeft = node.scrollLeft;
                node.style.cursor = 'grabbing';
                node.style.userSelect = 'none';

                if (!isListeningWindow) {
                    window.addEventListener('mouseup', handleMouseUp);
                    window.addEventListener('mousemove', handleMouseMove);
                    isListeningWindow = true;
                }
            };

            const handleDragStart = (e: DragEvent) => {
                e.preventDefault();
            };

            const handleClick = (e: MouseEvent) => {
                if (hasDragged) {
                    e.stopPropagation();
                    e.preventDefault();
                    hasDragged = false;
                }
            };

            node.style.cursor = 'grab';
            node.addEventListener('mousedown', handleMouseDown);
            node.addEventListener('dragstart', handleDragStart);
            node.addEventListener('click', handleClick, true);

            cleanup = () => {
                node.removeEventListener('mousedown', handleMouseDown);
                node.removeEventListener('dragstart', handleDragStart);
                node.removeEventListener('click', handleClick, true);
                if (isListeningWindow) {
                    window.removeEventListener('mouseup', handleMouseUp);
                    window.removeEventListener('mousemove', handleMouseMove);
                    isListeningWindow = false;
                }
                node.style.removeProperty('user-select');
            };
        };

        const target = getScrollNode(scrollRef.current);
        if (target) {
            bind(target);
        } else {
            rafId = requestAnimationFrame(() => {
                const deferredTarget = getScrollNode(scrollRef.current);
                if (deferredTarget) {
                    bind(deferredTarget);
                }
            });
        }

        return () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            if (cleanup) {
                cleanup();
            }
        };
    }, [scrollRef, enabled, dependency]);
}
