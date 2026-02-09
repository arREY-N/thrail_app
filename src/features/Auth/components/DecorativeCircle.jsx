import {
    StyleSheet,
    View
} from "react-native";

import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const DecorativeCircle = ({ title, style }) => (
    <View style={[styles.circleDisplay, style]}>
        <CustomText variant="body" style={styles.circleDisplayText}>
            {title}
        </CustomText>
    </View>
);

const styles = StyleSheet.create({
    circleDisplay: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.SECONDARY,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
    },
    circleDisplayText: { 
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
    },
});

export default DecorativeCircle;