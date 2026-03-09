import React from 'react';
import {
    ScrollView,
    StyleSheet,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import StickyFooter from '@/src/features/Book/components/StickyFooter';

import { Colors } from '@/src/constants/colors';

const StatusScreen = ({ onReturn }) => {
    return (
        <View style={styles.container}>
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.heroSection}>
                    <View style={styles.iconCircle}>
                        <CustomIcon 
                            library="MaterialCommunityIcons" 
                            name="check-decagram" 
                            size={64} 
                            color={Colors.SUCCESS} 
                        />
                    </View>
                    <CustomText variant="h1" style={styles.heroTitle}>
                        Request Submitted!
                    </CustomText>
                    <CustomText variant="body" style={styles.heroSubtitle}>
                        Your reservation request has been successfully sent to the tour provider.
                    </CustomText>
                </View>

                <View style={styles.instructionsContainer}>
                    <View style={styles.helpBox}>
                        <CustomIcon 
                            library="Feather" 
                            name="info" 
                            size={16} 
                            color={Colors.TEXT_SECONDARY} 
                        />
                        <CustomText variant="caption" style={styles.helpText}>
                            You will receive a notification as soon as your reservation status is updated.
                        </CustomText>
                    </View>

                </View>
            </ScrollView>

            <StickyFooter 
                title="Return to Trail" 
                onPress={onReturn} 
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
        paddingTop: 32,
    },
    
    // --- HERO STYLES ---
    heroSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 10,
        textAlign: 'center',
    },
    heroSubtitle: {
        textAlign: 'center',
        color: Colors.TEXT_SECONDARY,
        lineHeight: 22,
        paddingHorizontal: 10,
    },

    instructionsContainer: {
        marginTop: 10,
    },
    
    helpBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.GRAY_ULTRALIGHT,
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
        gap: 10,
    },
    helpText: {
        flex: 1,
        color: Colors.TEXT_SECONDARY,
        lineHeight: 20,
    }
});

export default StatusScreen;