import { StyleSheet, Text, View } from "react-native";

const DecorativeCircle = ({ title, style }) => (
    <View style={[styles.circleDisplay, style]}>
        <Text style={styles.circleDisplayText}>{title}</Text>
    </View>
);

const styles = StyleSheet.create({
    circleDisplay: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#bdbdbd',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
    },
    circleDisplayText: { 
        color: 'black', 
        fontWeight: 'bold',
        fontSize: 16 
    },
});

export default DecorativeCircle;