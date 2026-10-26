/**
 * @file MapZoomControls.tsx
 * @description Floating on-canvas 4-button zoom control panel (+, -, reset, pin visibility toggle)
 * aligned center-right with light and dark theme adaptation.
 */

import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';

/**
 * Properties for the MapZoomControls component.
 *
 * @param onZoomIn - Callback to increment zoom scale.
 * @param onZoomOut - Callback to decrement zoom scale.
 * @param onResetZoom - Callback to reset zoom to default.
 * @param showPins - Whether waypoint pins are currently visible.
 * @param onTogglePins - Callback to toggle waypoint pin visibility.
 * @param isDark - Whether dark theme is enabled.
 */
export interface MapZoomControlsProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetZoom: () => void;
    showPins: boolean;
    onTogglePins: () => void;
    isDark?: boolean;
}

/**
 * MapZoomControls presentation component.
 * 
 * @param props - Component properties.
 * @returns {React.JSX.Element} The rendered zoom controls panel.
 */
const MapZoomControls = React.memo<MapZoomControlsProps>(({
    onZoomIn,
    onZoomOut,
    onResetZoom,
    showPins,
    onTogglePins,
    isDark = false,
}) => {
    return (
        <View style={styles.zoomControlWrapper} pointerEvents="box-none">
            <View style={[styles.zoomControlPanel, isDark && styles.zoomControlPanelDark]}>
                <TouchableOpacity
                    style={[styles.zoomControlBtn, isDark && styles.zoomControlBtnDark]}
                    onPress={onZoomIn}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Zoom in"
                >
                    <CustomIcon
                        library="Feather"
                        name="plus"
                        size={18}
                        color={isDark ? Colors.WHITE : Colors.TEXT_PRIMARY}
                    />
                </TouchableOpacity>

                <View style={[styles.zoomDivider, isDark && styles.zoomDividerDark]} />

                <TouchableOpacity
                    style={[styles.zoomControlBtn, isDark && styles.zoomControlBtnDark]}
                    onPress={onZoomOut}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Zoom out"
                >
                    <CustomIcon
                        library="Feather"
                        name="minus"
                        size={18}
                        color={isDark ? Colors.WHITE : Colors.TEXT_PRIMARY}
                    />
                </TouchableOpacity>

                <View style={[styles.zoomDivider, isDark && styles.zoomDividerDark]} />

                <TouchableOpacity
                    style={[styles.zoomControlBtn, isDark && styles.zoomControlBtnDark]}
                    onPress={onResetZoom}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Reset zoom"
                >
                    <CustomIcon
                        library="Feather"
                        name="rotate-ccw"
                        size={15}
                        color={isDark ? Colors.WHITE : Colors.TEXT_PRIMARY}
                    />
                </TouchableOpacity>

                <View style={[styles.zoomDivider, isDark && styles.zoomDividerDark]} />

                <TouchableOpacity
                    style={[styles.zoomControlBtn, isDark && styles.zoomControlBtnDark]}
                    onPress={onTogglePins}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={showPins ? 'Hide map pins' : 'Show map pins'}
                >
                    <CustomIcon
                        library="MaterialCommunityIcons"
                        name={showPins ? 'map-marker' : 'map-marker-off'}
                        size={18}
                        color={
                            showPins
                                ? (isDark ? Colors.WHITE : Colors.TEXT_PRIMARY)
                                : (isDark ? Colors.GRAY_MEDIUM : Colors.TEXT_SECONDARY)
                        }
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
});

MapZoomControls.displayName = 'MapZoomControls';

const styles = StyleSheet.create({
    zoomControlWrapper: {
        position: 'absolute',
        right: 14,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        zIndex: 10,
    },
    zoomControlPanel: {
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        ...GlobalStyles.dropShadow(3),
        overflow: 'hidden',
    },
    zoomControlPanelDark: {
        backgroundColor: Colors.MAP_CARD_BACKDROP,
        borderColor: Colors.MAP_CARD_BORDER,
    },
    zoomControlBtn: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.WHITE,
    },
    zoomControlBtnDark: {
        backgroundColor: 'transparent',
    },
    zoomDivider: {
        height: 1,
        backgroundColor: Colors.GRAY_LIGHT,
        width: '100%',
    },
    zoomDividerDark: {
        backgroundColor: Colors.MAP_CARD_BORDER,
    },
});

export default MapZoomControls;
