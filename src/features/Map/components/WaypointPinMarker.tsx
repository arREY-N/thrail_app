/**
 * @file WaypointPinMarker.tsx
 * @description Memoized visual map pin marker component positioned using percentage coordinates
 * with dynamic z-index, Feather icon glyph, and semantic pin color styling.
 */

import React, { useMemo } from 'react';
import {
    GestureResponderEvent,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { IWaypointPoint } from '@/src/features/Map/interfaces/Map.types';
import { getPinConfig } from '@/src/features/Map/utils/pinConfig';

/**
 * Properties for the WaypointPinMarker component.
 *
 * @param point - The waypoint point data containing coordinates, type, color, and icon.
 * @param isSelected - Whether this pin is currently selected/active.
 * @param onPress - Callback when the pin is pressed.
 */
export interface WaypointPinMarkerProps {
    point: IWaypointPoint;
    isSelected: boolean;
    onPress: (event: GestureResponderEvent, point: IWaypointPoint) => void;
}

/**
 * WaypointPinMarker presentation component.
 * 
 * @param props - Component properties.
 * @returns {React.JSX.Element} The rendered pin marker.
 */
const WaypointPinMarker = React.memo<WaypointPinMarkerProps>(({ point, isSelected, onPress }) => {
    const config = useMemo(
        () => getPinConfig(point.type, point.color, point.customCategory, point.icon),
        [point.type, point.color, point.customCategory, point.icon]
    );

    const positionStyle = useMemo(
        () => [{ left: `${point.x}%`, top: `${point.y}%` } as const, { zIndex: isSelected ? 20 : 5 }],
        [point.x, point.y, isSelected]
    );

    return (
        <TouchableOpacity
            style={[styles.pinWrapper, positionStyle]}
            onPress={(e) => onPress(e, point)}
            hitSlop={{ top: 2, bottom: 2, left: 2, right: 2 }}
            activeOpacity={0.7}
        >
            <View style={[styles.pinCircle, { backgroundColor: config.color }]}>
                <CustomIcon library="Feather" name={config.icon} size={11} color={Colors.WHITE} />
            </View>
            <View style={[styles.pinTriangle, { borderTopColor: config.color }]} />
        </TouchableOpacity>
    );
});

WaypointPinMarker.displayName = 'WaypointPinMarker';

const styles = StyleSheet.create({
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
        opacity: 0.95,
    },
    pinTriangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 4,
        borderRightWidth: 4,
        borderTopWidth: 5,
        borderBottomWidth: 0,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        marginTop: -0.5,
        opacity: 0.95,
    },
});

export default WaypointPinMarker;
