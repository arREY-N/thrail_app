import React from 'react';
import { StyleSheet, View } from 'react-native';

import CustomButton from '../../../components/CustomButton';
import CustomHeader from '../../../components/CustomHeader';
import CustomText from '../../../components/CustomText';

import { Colors } from '../../../constants/colors';

const ProfileScreen = ({
    onSignOutPress, 
    onApplyPress,
    profile,
}) => {

    const createdDate = profile?.createdAt?.toDate 
        ? profile.createdAt.toDate().toLocaleDateString() 
        : "N/A";

    return (
        <View style={styles.container}>
            <CustomHeader 
                title="Profile"
                showDefaultIcons={true} 
            />

            <View style={styles.contentContainer}>
                <CustomText variant="subtitle" style={styles.headerTitle}>
                    User Profile
                </CustomText>

                <View style={styles.profileInfo}>
                    <CustomText variant="caption" style={styles.sectionLabel}>
                        USER INFORMATION
                    </CustomText>

                    <CustomText style={styles.infoText}>
                        Name: {profile?.firstname} {profile?.lastname}
                    </CustomText>
                    <CustomText style={styles.infoText}>
                        Username: {profile?.username}
                    </CustomText>
                    <CustomText style={styles.infoText}>
                        Email: {profile?.email}
                    </CustomText>
                    <CustomText style={styles.infoText}>
                        Created: {createdDate}
                    </CustomText>
                </View>

                <View style={styles.actionContainer}>
                    <CustomButton 
                        title="Apply for Business Account" 
                        onPress={onApplyPress} 
                        variant="primary"
                        style={styles.buttonSpacing}
                    />

                    <CustomButton 
                        title="Sign Out" 
                        onPress={onSignOutPress} 
                        variant="outline"
                        style={styles.buttonSpacing}
                    />
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
    contentContainer: {
        padding: 16,
    },
    headerTitle: {
        marginBottom: 16,
    },
    profileInfo: {
        marginBottom: 32,
        padding: 16,
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    sectionLabel: {
        fontWeight: 'bold',
        marginBottom: 12,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    infoText: {
        marginBottom: 6,
    },
    actionContainer: {
        gap: 8,
    },
    buttonSpacing: {
        marginBottom: 8,
    }
});

export default ProfileScreen;