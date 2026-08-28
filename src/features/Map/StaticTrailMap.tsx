/**
 * @file StaticTrailMap.tsx
 * @description Static trail map component rendering offline route maps with intrinsic 4:3 aspect-ratio preservation,
 * cross-platform touch coordinate resolution, immediate pin visibility, interactive pin overlays,
 * full 2D (horizontal and vertical) free pan and zoom, strict viewport clipping,
 * on-canvas floating zoom controls (+, -, Reset), PointDetailsModal inspection, and EditPointModal integration.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    GestureResponderEvent,
    Image,
    LayoutChangeEvent,
    Pressable,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ResumableZoom, ResumableZoomRefType } from 'react-native-zoom-toolkit';

import ConfirmationModal from '@/src/components/ConfirmationModal';
import CustomIcon from '@/src/components/CustomIcon';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { IOfflinePoint } from '@/src/core/models/Trail/interfaces/Trail.types';
import EditPointModal from '@/src/features/SuperAdmin/components/EditPointModal';
import PointDetailsModal from '@/src/features/SuperAdmin/components/PointDetailsModal';
import { PIN_TYPES, PinType } from './map.types';
import { getStaticMapAsset } from './trailMapAssets';

export { PIN_TYPES, PinType };

/**
 * Properties for the StaticTrailMap component.
 *
 * @param trailId - The ID of the trail used to resolve map assets.
 * @param trailName - Optional name of the trail.
 * @param offlinePoints - Array of offline point/pin objects.
 * @param isEditable - Flag enabling pin creation, updating, and deletion.
 * @param onChange - Callback triggered when offline points list changes.
 * @param onGestureActive - Callback triggered when user starts or ends gesture.
 */
interface StaticTrailMapProps {
    trailId: string;
    trailName?: string;
    offlinePoints: IOfflinePoint[];
    isEditable?: boolean;
    onChange?: (points: IOfflinePoint[]) => void;
    onGestureActive?: (active: boolean) => void;
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
 * StaticTrailMap component.
 * Displays a static trail map background with interactive, percentage-positioned waypoint pin overlays.
 * Supports full 2D panning (up, down, left, right), floating zoom controls (+, -, Reset),
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
    onChange,
    onGestureActive,
}: StaticTrailMapProps): React.JSX.Element => {
    const zoomRef = useRef<ResumableZoomRefType>(null);
    const [containerLayout, setContainerLayout] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const [selectedPoint, setSelectedPoint] = useState<IOfflinePoint | null>(null);

    // Editor Modal States
    const [editorModalVisible, setEditorModalVisible] = useState<boolean>(false);
    const [editingPoint, setEditingPoint] = useState<IOfflinePoint | null>(null);
    const [draftCoords, setDraftCoords] = useState<{ x: number; y: number } | null>(null);

    // Confirmation Modal Deletion State
    const [pointToDelete, setPointToDelete] = useState<IOfflinePoint | null>(null);

    const mapAsset = getStaticMapAsset(trailId, trailName);

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

    const handleMapPress = (event: GestureResponderEvent) => {
        if (!isEditable) return;

        if (inlineCanvas.width <= 0 || inlineCanvas.height <= 0) return;

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

    const handlePinPress = (event: GestureResponderEvent, point: IOfflinePoint) => {
        event.stopPropagation?.();
        setSelectedPoint(point);
    };

    const handleSaveModalPoint = (pointData: { name: string; type: PinType; description: string }) => {
        if (editingPoint) {
            const updatedPoints = offlinePoints.map((p) => {
                if (p.id === editingPoint.id) {
                    return { ...p, ...pointData };
                }
                return p;
            });
            onChange?.(updatedPoints);

            if (selectedPoint && selectedPoint.id === editingPoint.id) {
                setSelectedPoint({ ...selectedPoint, ...pointData });
            }
        } else {
            if (!draftCoords) return;
            const newPoint: IOfflinePoint = {
                id: Date.now().toString(),
                name: pointData.name,
                type: pointData.type,
                description: pointData.description,
                x: draftCoords.x,
                y: draftCoords.y,
            };
            onChange?.([...offlinePoints, newPoint]);
        }

        setEditorModalVisible(false);
        setDraftCoords(null);
        setEditingPoint(null);
    };

    const handleEditPointPress = (point: IOfflinePoint) => {
        setEditingPoint(point);
        setEditorModalVisible(true);
    };

    const handleDeletePointPress = (point: IOfflinePoint) => {
        setPointToDelete(point);
    };

    const handleConfirmDeletePoint = () => {
        if (!pointToDelete) return;
        const updatedPoints = offlinePoints.filter((p) => p.id !== pointToDelete.id);
        onChange?.(updatedPoints);
        if (selectedPoint?.id === pointToDelete.id) {
            setSelectedPoint(null);
        }
        setPointToDelete(null);
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

    const getPinConfig = (type: string) => {
        return PIN_TYPES.find((t) => t.value === type) || PIN_TYPES[1];
    };

    return (
        <GestureHandlerRootView
            style={styles.container}
            onLayout={handleContainerLayout}
            onTouchStart={() => onGestureActive?.(true)}
            onTouchEnd={() => onGestureActive?.(false)}
            onTouchCancel={() => onGestureActive?.(false)}
        >
            {containerLayout.width > 0 && containerLayout.height > 0 ? (
                <View style={styles.mapInnerWrapper}>
                    {/* Centered Map Canvas Viewport with Strict Clipping */}
                    <View style={styles.centeringContainer}>
                        {inlineCanvas.width > 0 && inlineCanvas.height > 0 && (
                            <ResumableZoom
                                ref={zoomRef}
                                style={{ width: inlineCanvas.width, height: inlineCanvas.height }}
                                maxScale={5}
                                minScale={1}
                                extendGestures={true}
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

                                    {/* Touch Overlay to capture pin placement taps */}
                                    <Pressable onPress={handleMapPress} style={StyleSheet.absoluteFill} />

                                    {/* Render percentage-positioned map pins (Always visible immediately) */}
                                    {offlinePoints.map((point) => {
                                        const config = getPinConfig(point.type);
                                        return (
                                            <TouchableOpacity
                                                key={point.id}
                                                style={[
                                                    styles.pinWrapper,
                                                    { left: `${point.x}%`, top: `${point.y}%` },
                                                ]}
                                                onPress={(e) => handlePinPress(e, point)}
                                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                                activeOpacity={0.7}
                                            >
                                                <View style={[styles.pinCircle, { backgroundColor: config.color }]}>
                                                    <CustomIcon library="Feather" name={config.icon} size={11} color={Colors.WHITE} />
                                                </View>
                                                <View style={styles.pinTriangle} />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ResumableZoom>
                        )}
                    </View>

                    {/* Floating On-Canvas Zoom Controls */}
                    <View style={styles.zoomControlPanel}>
                        <TouchableOpacity
                            style={styles.zoomControlBtn}
                            onPress={handleZoomIn}
                            activeOpacity={0.7}
                        >
                            <CustomIcon library="Feather" name="plus" size={18} color={Colors.TEXT_PRIMARY} />
                        </TouchableOpacity>
                        <View style={styles.zoomDivider} />
                        <TouchableOpacity
                            style={styles.zoomControlBtn}
                            onPress={handleZoomOut}
                            activeOpacity={0.7}
                        >
                            <CustomIcon library="Feather" name="minus" size={18} color={Colors.TEXT_PRIMARY} />
                        </TouchableOpacity>
                        <View style={styles.zoomDivider} />
                        <TouchableOpacity
                            style={styles.zoomControlBtn}
                            onPress={handleResetZoom}
                            activeOpacity={0.7}
                        >
                            <CustomIcon library="Feather" name="rotate-ccw" size={15} color={Colors.TEXT_PRIMARY} />
                        </TouchableOpacity>
                    </View>
                </View>
            ) : null}

            {/* Dedicated Decoupled Waypoint Point Details Modal Sheet */}
            <PointDetailsModal
                visible={Boolean(selectedPoint)}
                point={selectedPoint}
                isEditable={isEditable}
                onClose={() => setSelectedPoint(null)}
                onEdit={handleEditPointPress}
                onDelete={handleDeletePointPress}
            />

            {/* Co-located Waypoint Creation and Information Edit Dialog Modal */}
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
                iconName='trash-2'
                onConfirm={handleConfirmDeletePoint}
                onClose={() => setPointToDelete(null)}
            />
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
    zoomControlPanel: {
        position: 'absolute',
        top: 14,
        right: 14,
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(3),
        zIndex: 10,
        overflow: 'hidden',
    },
    zoomControlBtn: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.WHITE,
    },
    zoomDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
        width: '100%',
    },
    pinWrapper: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ translateX: -11 }, { translateY: -25.5 }],
    },
    pinCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: Colors.WHITE,
        alignItems: 'center',
        justifyContent: 'center',
        ...GlobalStyles.dropShadow(2),
        opacity: 0.9,
    },
    pinTriangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 3.5,
        borderRightWidth: 3.5,
        borderBottomWidth: 4,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: Colors.WHITE,
        transform: [{ rotate: '180deg' }],
        marginTop: -0.5,
        opacity: 0.9,
    },
});

export default StaticTrailMap;
