/**
 * @file StaticTrailMap.tsx
 * @description Static trail map component rendering offline route maps with intrinsic 4:3 aspect-ratio preservation,
 * cross-platform touch coordinate resolution, immediate pin visibility, interactive pin overlays,
 * full 2D (horizontal and vertical) free pan and zoom, strict viewport clipping,
 * on-canvas floating zoom controls (+, -, Reset, pin toggle), PointDetailsModal inspection, and EditPointModal integration.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    GestureResponderEvent,
    Image,
    LayoutChangeEvent,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ResumableZoom, ResumableZoomRefType } from 'react-native-zoom-toolkit';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import { useToast } from '@/src/components/Toast/Toast';
import { Colors } from '@/src/constants/colors';
import { IOfflinePoint } from '@/src/core/models/Trail/Trail';
import MapZoomControls from '@/src/features/Map/components/MapZoomControls';
import WaypointPinMarker from '@/src/features/Map/components/WaypointPinMarker';
import {
    IPinConfig,
    IWaypointPoint,
    PinIconName,
} from '@/src/features/Map/interfaces/Map.types';
import EditPointModal from '@/src/features/Map/modals/EditPointModal';
import PointDetailsModal from '@/src/features/Map/modals/PointDetailsModal';
import {
    getPinConfig,
    PIN_COLOR_SWATCHES,
    PIN_TYPES,
    PinType,
} from '@/src/features/Map/utils/pinConfig';
import { getStaticMapAsset } from '@/src/features/Map/utils/trailMapAssets';

export {
    getPinConfig,
    IPinConfig,
    IWaypointPoint,
    PIN_COLOR_SWATCHES,
    PIN_TYPES,
    PinType,
};

/**
 * Properties for the StaticTrailMap component.
 *
 * @param trailId - The ID of the trail used to resolve map assets.
 * @param trailName - Optional name of the trail.
 * @param offlinePoints - Array of offline point/pin objects.
 * @param isEditable - Flag enabling pin creation, updating, and deletion.
 * @param routeMapImage - Optional remote route map image override.
 * @param suppressDetailsModal - Whether to suppress the built-in details modal.
 * @param onPointSelect - Callback when a waypoint pin is selected.
 * @param onChange - Callback triggered when offline points list changes.
 * @param onGestureActive - Callback triggered when user starts or ends gesture.
 * @param theme - Visual theme ('light' or 'dark').
 */
export interface StaticTrailMapProps {
    trailId: string;
    trailName?: string;
    offlinePoints: (IOfflinePoint | IWaypointPoint)[];
    isEditable?: boolean;
    routeMapImage?: string;
    suppressDetailsModal?: boolean;
    onPointSelect?: (point: IWaypointPoint | null) => void;
    onChange?: (points: IWaypointPoint[]) => void;
    onGestureActive?: (active: boolean) => void;
    theme?: 'light' | 'dark';
}

/** All trail map PNG assets are standard 800x600 (4:3 aspect ratio = 1.333333) */
const MAP_ASPECT_RATIO = 800 / 600;

/**
 * Calculates 4:3 fitted canvas dimensions within a given container box.
 * 
 * @param containerW - Available container width.
 * @param containerH - Available container height.
 * @returns {{ width: number; height: number }} Fitted canvas dimensions.
 */
const computeFittedCanvas = (containerW: number, containerH: number): { width: number; height: number } => {
    if (containerW <= 0 || containerH <= 0) return { width: 0, height: 0 };
    const containerAspect = containerW / containerH;

    if (containerAspect > MAP_ASPECT_RATIO) {
        // Container is wider than 4:3 (e.g. desktop widescreen) -> fit height
        const height = containerH;
        const width = height * MAP_ASPECT_RATIO;
        return { width, height };
    } else {
        // Container is taller than 4:3 (e.g. mobile portrait) -> fit width
        const width = containerW;
        const height = width / MAP_ASPECT_RATIO;
        return { width, height };
    }
};

interface INativeTouchEvent {
    locationX?: number;
    locationY?: number;
    offsetX?: number;
    offsetY?: number;
    clientX?: number;
    clientY?: number;
    pageX?: number;
    pageY?: number;
}

interface IDomTarget {
    getBoundingClientRect?: () => { left: number; top: number };
}

/**
 * StaticTrailMap presentation component.
 * Displays a static trail map background with interactive, percentage-positioned waypoint pin overlays.
 * Supports full 2D panning (up, down, left, right), floating zoom controls (+, -, Reset, Pin Toggle),
 * and decoupled PointDetailsModal inspection.
 *
 * @param props - Component properties.
 * @returns {React.JSX.Element} The static trail map component.
 */
const StaticTrailMap = ({
    trailId,
    trailName,
    offlinePoints = [],
    isEditable = false,
    routeMapImage,
    suppressDetailsModal = false,
    onPointSelect,
    onChange,
    onGestureActive,
    theme = 'light',
}: StaticTrailMapProps): React.JSX.Element => {
    const isDark = theme === 'dark';
    const { showToast } = useToast();
    const zoomRef = useRef<ResumableZoomRefType>(null);
    const touchStartPos = useRef<{ x: number; y: number } | null>(null);
    const [containerLayout, setContainerLayout] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const [selectedPoint, setSelectedPoint] = useState<IWaypointPoint | null>(null);
    const [showPins, setShowPins] = useState<boolean>(true);

    const handleTogglePins = useCallback(() => {
        setShowPins((prev) => {
            const nextState = !prev;
            if (!nextState) {
                setSelectedPoint(null);
                onPointSelect?.(null);
            }
            return nextState;
        });
    }, [onPointSelect]);

    // Editor Modal States
    const [editorModalVisible, setEditorModalVisible] = useState<boolean>(false);
    const [editingPoint, setEditingPoint] = useState<IWaypointPoint | null>(null);
    const [draftCoords, setDraftCoords] = useState<{ x: number; y: number } | null>(null);

    // Confirmation Modal Deletion State
    const [pointToDelete, setPointToDelete] = useState<IWaypointPoint | null>(null);

    const mapAsset = useMemo(() => {
        if (routeMapImage && typeof routeMapImage === 'string' && routeMapImage.trim().length > 0) {
            return { uri: routeMapImage };
        }
        return getStaticMapAsset(trailId, trailName);
    }, [routeMapImage, trailId, trailName]);

    // Compute fitted 4:3 canvas size for the container
    const inlineCanvas = useMemo(() => {
        return computeFittedCanvas(containerLayout.width, containerLayout.height);
    }, [containerLayout.width, containerLayout.height]);

    const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        if (width > 0 && height > 0) {
            setContainerLayout({ width, height });
        }
    }, []);

    const handlePressIn = (event: GestureResponderEvent) => {
        const native = event.nativeEvent as unknown as INativeTouchEvent;
        const x = native.pageX ?? native.clientX ?? native.locationX ?? 0;
        const y = native.pageY ?? native.clientY ?? native.locationY ?? 0;
        touchStartPos.current = { x, y };
    };

    const handleMapPress = (event: GestureResponderEvent) => {
        if (!isEditable) return;

        if (inlineCanvas.width <= 0 || inlineCanvas.height <= 0) return;

        // Displacement threshold check: suppress modal trigger on drag/pan
        if (touchStartPos.current) {
            const native = event.nativeEvent as unknown as INativeTouchEvent;
            const endX = native.pageX ?? native.clientX ?? native.locationX ?? 0;
            const endY = native.pageY ?? native.clientY ?? native.locationY ?? 0;
            const dx = endX - touchStartPos.current.x;
            const dy = endY - touchStartPos.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            touchStartPos.current = null;

            if (distance > 8) {
                // User panned or dragged across the map canvas; do not register as tap
                return;
            }
        }

        const native = event.nativeEvent as unknown as INativeTouchEvent;
        let touchX = 0;
        let touchY = 0;

        // Cross-platform touch resolution (Native vs Web)
        if (typeof native.locationX === 'number' && typeof native.locationY === 'number') {
            touchX = native.locationX;
            touchY = native.locationY;
        } else if (typeof native.offsetX === 'number' && typeof native.offsetY === 'number') {
            touchX = native.offsetX;
            touchY = native.offsetY;
        } else {
            const rawTarget = (event.currentTarget || (event as unknown as { target?: IDomTarget }).target);
            const target = rawTarget as unknown as IDomTarget | undefined;
            if (target && typeof target.getBoundingClientRect === 'function') {
                const rect = target.getBoundingClientRect();
                const clientX = native.clientX ?? native.pageX ?? 0;
                const clientY = native.clientY ?? native.pageY ?? 0;
                touchX = clientX - rect.left;
                touchY = clientY - rect.top;
            }
        }

        // Clamp coordinates within [0, inlineCanvas]
        const clampedX = Math.max(0, Math.min(inlineCanvas.width, touchX));
        const clampedY = Math.max(0, Math.min(inlineCanvas.height, touchY));

        const x = Math.round(((clampedX / inlineCanvas.width) * 100) * 100) / 100;
        const y = Math.round(((clampedY / inlineCanvas.height) * 100) * 100) / 100;

        setDraftCoords({ x, y });
        setEditingPoint(null);
        setEditorModalVisible(true);
    };

    const handlePinPress = useCallback((event: GestureResponderEvent, point: IWaypointPoint) => {
        event.stopPropagation?.();

        // Check for overlapping sibling pins within close proximity (< 26px)
        const canvasW = inlineCanvas.width > 0 ? inlineCanvas.width : 800;
        const canvasH = inlineCanvas.height > 0 ? inlineCanvas.height : 600;
        const currentPxX = (point.x / 100) * canvasW;
        const currentPxY = (point.y / 100) * canvasH;

        const cluster = (offlinePoints as IWaypointPoint[]).filter((p) => {
            const pxX = (p.x / 100) * canvasW;
            const pxY = (p.y / 100) * canvasH;
            const dist = Math.hypot(pxX - currentPxX, pxY - currentPxY);
            return dist <= 26; // 26px cluster threshold
        });

        let targetPoint = point;
        if (cluster.length > 1 && selectedPoint) {
            const currentIndex = cluster.findIndex((p) => p.id === selectedPoint.id);
            if (currentIndex !== -1) {
                // If one of the cluster pins is already active, cycle to the next overlapping pin
                const nextIndex = (currentIndex + 1) % cluster.length;
                targetPoint = cluster[nextIndex];
            }
        }

        setSelectedPoint(targetPoint);
        onPointSelect?.(targetPoint);
    }, [inlineCanvas.width, inlineCanvas.height, offlinePoints, selectedPoint, onPointSelect]);

    const handleSaveModalPoint = (pointData: {
        name: string;
        type: PinType;
        description: string;
        customCategory?: string;
        color?: string;
        icon?: PinIconName;
    }) => {
        const cleanPayload: Partial<IWaypointPoint> = {
            name: pointData.name,
            type: pointData.type,
            description: pointData.description,
        };
        if (pointData.type === 'other') {
            if (pointData.customCategory) cleanPayload.customCategory = pointData.customCategory;
            if (pointData.color) cleanPayload.color = pointData.color;
            if (pointData.icon) cleanPayload.icon = pointData.icon;
        }

        if (editingPoint) {
            const updatedPoints: IWaypointPoint[] = offlinePoints.map((p) => {
                if (p.id === editingPoint.id) {
                    const basePoint = { ...p } as IWaypointPoint;
                    if (pointData.type !== 'other') {
                        delete basePoint.customCategory;
                        delete basePoint.color;
                        delete basePoint.icon;
                    }
                    return { ...basePoint, ...cleanPayload };
                }
                return p as IWaypointPoint;
            });
            onChange?.(updatedPoints);

            if (selectedPoint && selectedPoint.id === editingPoint.id) {
                const baseSelected = { ...selectedPoint };
                if (pointData.type !== 'other') {
                    delete baseSelected.customCategory;
                    delete baseSelected.color;
                    delete baseSelected.icon;
                }
                const merged: IWaypointPoint = { ...baseSelected, ...cleanPayload };
                setSelectedPoint(merged);
                onPointSelect?.(merged);
            }
            showToast.success(`Waypoint "${pointData.name}" updated.`);
        } else {
            if (!draftCoords) return;
            const newPoint: IWaypointPoint = {
                id: Date.now().toString(),
                name: pointData.name,
                type: pointData.type,
                description: pointData.description,
                x: draftCoords.x,
                y: draftCoords.y,
                ...(pointData.type === 'other' && pointData.customCategory ? { customCategory: pointData.customCategory } : {}),
                ...(pointData.type === 'other' && pointData.color ? { color: pointData.color } : {}),
                ...(pointData.type === 'other' && pointData.icon ? { icon: pointData.icon } : {}),
            };
            onChange?.([...(offlinePoints as IWaypointPoint[]), newPoint]);
            showToast.success(`Waypoint "${pointData.name}" added to map.`);
        }

        setShowPins(true);
        setEditorModalVisible(false);
        setDraftCoords(null);
        setEditingPoint(null);
    };

    const handleEditPointPress = (point: IWaypointPoint) => {
        setEditingPoint(point);
        setEditorModalVisible(true);
    };

    const handleDeletePointPress = (point: IWaypointPoint) => {
        setPointToDelete(point);
    };

    const handleConfirmDeletePoint = () => {
        if (!pointToDelete) return;
        const deletedName = pointToDelete.name;
        const updatedPoints = (offlinePoints as IWaypointPoint[]).filter((p) => p.id !== pointToDelete.id);
        onChange?.(updatedPoints);
        if (selectedPoint?.id === pointToDelete.id) {
            setSelectedPoint(null);
            onPointSelect?.(null);
        }
        setPointToDelete(null);
        showToast.info(`Waypoint "${deletedName}" removed.`);
    };

    const handleZoomIn = () => {
        if (!zoomRef.current) return;
        const currentScale = zoomRef.current.getState()?.scale || 1;
        const targetScale = Math.min(5, Math.round((currentScale + 0.6) * 10) / 10);
        zoomRef.current.zoom(targetScale);
    };

    const handleZoomOut = () => {
        if (!zoomRef.current) return;
        const currentScale = zoomRef.current.getState()?.scale || 1;
        const targetScale = Math.max(1, Math.round((currentScale - 0.6) * 10) / 10);
        zoomRef.current.zoom(targetScale);
    };

    const handleResetZoom = () => {
        zoomRef.current?.reset(true);
    };

    return (
        <GestureHandlerRootView
            style={[styles.container, isDark && styles.containerDark]}
            onLayout={handleContainerLayout}
            onTouchStart={() => onGestureActive?.(true)}
            onTouchEnd={() => onGestureActive?.(false)}
            onTouchCancel={() => onGestureActive?.(false)}
        >
            {containerLayout.width > 0 && containerLayout.height > 0 ? (
                <View style={styles.mapInnerWrapper}>
                    {/* Centered Map Canvas Viewport with Strict Clipping */}
                    <View style={[styles.centeringContainer, isDark && styles.centeringContainerDark]}>
                        {inlineCanvas.width > 0 && inlineCanvas.height > 0 && (
                            <ResumableZoom
                                ref={zoomRef}
                                style={{ width: inlineCanvas.width, height: inlineCanvas.height }}
                                maxScale={5}
                                minScale={1}
                                extendGestures={false}
                                panMode="free"
                                pinchMode="clamp"
                                allowPinchPanning={true}
                            >
                                <View style={[styles.mapCanvas, { width: inlineCanvas.width, height: inlineCanvas.height }]}>
                                    {/* 4:3 Aspect-Ratio Map Image */}
                                    <Image
                                        source={mapAsset}
                                        style={styles.fullSize}
                                        resizeMode="stretch"
                                    />

                                    {/* Touch Overlay to capture pin placement taps (only in edit mode) */}
                                    {isEditable && (
                                        <Pressable
                                            onPressIn={handlePressIn}
                                            onPress={handleMapPress}
                                            style={StyleSheet.absoluteFill}
                                        />
                                    )}

                                    {/* Render percentage-positioned map pins (Visible when showPins is enabled) */}
                                    {showPins && offlinePoints.map((rawPoint) => {
                                        const point = rawPoint as IWaypointPoint;
                                        return (
                                            <WaypointPinMarker
                                                key={point.id}
                                                point={point}
                                                isSelected={selectedPoint?.id === point.id}
                                                onPress={handlePinPress}
                                            />
                                        );
                                    })}
                                </View>
                            </ResumableZoom>
                        )}
                    </View>

                    {/* Floating On-Canvas Zoom & Pin Controls (Center-Right Aligned) */}
                    <MapZoomControls
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onResetZoom={handleResetZoom}
                        showPins={showPins}
                        onTogglePins={handleTogglePins}
                        isDark={isDark}
                    />
                </View>
            ) : null}

            {/* Dedicated Decoupled Waypoint Point Details Modal Sheet */}
            {!suppressDetailsModal && (
                <PointDetailsModal
                    visible={Boolean(selectedPoint)}
                    point={selectedPoint}
                    isEditable={isEditable}
                    onClose={() => {
                        setSelectedPoint(null);
                        onPointSelect?.(null);
                    }}
                    onEdit={handleEditPointPress}
                    onDelete={handleDeletePointPress}
                />
            )}

            {/* Co-located Waypoint Creation and Information Edit Dialog Modal */}
            {isEditable && (
                <>
                    <EditPointModal
                        visible={editorModalVisible}
                        onClose={() => {
                            setEditorModalVisible(false);
                            setEditingPoint(null);
                        }}
                        onSave={handleSaveModalPoint}
                        editingPoint={editingPoint}
                    />

                    {/* Standardized Delete Confirmation Modal */}
                    <ConfirmationModal
                        visible={Boolean(pointToDelete)}
                        title="Delete Map Point"
                        message={`Are you sure you want to delete "${pointToDelete?.name}"?`}
                        confirmText="Delete Point"
                        cancelText="Cancel"
                        isDestructive={true}
                        iconName="trash-2"
                        onConfirm={handleConfirmDeletePoint}
                        onClose={() => setPointToDelete(null)}
                    />
                </>
            )}
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
        position: 'relative',
        overflow: 'hidden',
    },
    mapInnerWrapper: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    fullSize: {
        width: '100%',
        height: '100%',
    },
    centeringContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        overflow: 'hidden',
    },
    mapCanvas: {
        position: 'relative',
        overflow: 'hidden',
    },
    containerDark: {
        backgroundColor: 'transparent',
    },
    centeringContainerDark: {
        backgroundColor: 'transparent',
    },
});

export default StaticTrailMap;
