import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import CustomHeader from '../../../components/CustomHeader';
import CustomText from '../../../components/CustomText';
import { Colors } from '../../../constants/colors';

const ExploreScreen = ({ 
    trails, 
    onViewMountain 
}) => {

    return (
        <View style={styles.container}>
            <CustomHeader 
                title="Explore"
                showDefaultIcons={true} 
            />

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <CustomText variant="subtitle" style={styles.pageTitle}>
                    Available Trails
                </CustomText>
                
                {trails?.map((t) => {
                    return (
                        <Pressable 
                            onPress={() => onViewMountain(t.id)} 
                            key={t.id}
                            style={({ pressed }) => [
                                styles.trailCard,
                                pressed && styles.cardPressed
                            ]}
                        >
                            <CustomText variant="body" style={styles.trailName}>
                                {t.name}
                            </CustomText>
                        </Pressable>
                    )
                })}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
    scrollContent: {
        padding: 16,
    },
    pageTitle: {
        marginBottom: 16,
    },
    trailCard: {
        backgroundColor: Colors.WHITE,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardPressed: {
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        transform: [{ scale: 0.98 }],
    },
    trailName: {
        fontWeight: '600',
    }
});

export default ExploreScreen;