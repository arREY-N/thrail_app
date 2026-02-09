import {
    StyleSheet,
    View,
    useWindowDimensions
} from "react-native";

import { Colors } from '@/src/constants/colors';

const MountainGraphic = () => {
    const { width } = useWindowDimensions();

    const effectiveWidth = Math.min(width, 412);
    const scaleFactor = effectiveWidth / 400;

    return (
        <View style={[styles.mountainContainer, { transform: [{ scale: scaleFactor }] }]}>
            <View style={styles.mountainLeft} />
            <View style={styles.mountainRight} />
        </View>
    );
};

const styles = StyleSheet.create({
    mountainContainer: {
        position: 'absolute',
        bottom: 0,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        width: '100%',
        zIndex: -1,
        transformOrigin: 'bottom Center', 
    },
    mountainLeft: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 100,
        borderRightWidth: 100,
        borderBottomWidth: 180,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: Colors.GRAY_MEDIUM,
        marginRight: -80,
    },
    mountainRight: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 80,
        borderRightWidth: 80,
        borderBottomWidth: 140,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: Colors.GRAY_LIGHT,
    },
});

export default MountainGraphic;