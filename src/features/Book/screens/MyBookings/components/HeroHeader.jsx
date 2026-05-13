import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const HeroHeader = ({ booking }) => {
    const trail = booking?.trail;

    const hasValidLocation = trail?.location && trail.location.trim() !== '' && trail.location !== 'N/A';

    return (
        <View style={styles.container}>
            <CustomText variant="h1" style={styles.trailName}>
                {trail?.name || 'N/A'}
            </CustomText>

            {hasValidLocation && (
                <View style={styles.locationRow}>
                    <CustomIcon 
                        library="Feather" 
                        name="map-pin" 
                        size={16} 
                        color={Colors.TEXT_SECONDARY} 
                    />
                    <CustomText variant="body" style={styles.locationText}>
                        {trail.location}
                    </CustomText>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
        backgroundColor: Colors.BACKGROUND,
        // alignItems: 'center',
    },
    trailName: {
        color: Colors.TEXT_PRIMARY,
        fontSize: 32,
        fontWeight: 'bold',
        lineHeight: 38,
        marginBottom: 8,
        // textAlign: 'center',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        // justifyContent: 'center',
        gap: 8,
    },
    locationText: {
        color: Colors.TEXT_SECONDARY,
    },
});

export default HeroHeader;