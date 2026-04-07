import React, { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';

const PersonnelWriteScreen = ({
    businessAdmins,
    onFindUserPress,
    searched,
    onMakeAdminPress,
    isOwner,
    isLoading,
    onBackPress 
}) => {
    const [email, setEmail] = useState('');

    const handleSearch = () => {
        if (email.trim()) onFindUserPress(email);
    };

    const UserResultCard = ({ user }) => {
        const isAlreadyAdmin = user.role === 'admin';

        return (
            <View style={styles.card}>
                <View style={styles.avatar}>
                    <CustomIcon 
                        library="Feather" 
                        name="user" 
                        size={20} 
                        color={Colors.WHITE} 
                    />
                </View>
                
                <View style={styles.adminInfo}>
                    <CustomText variant="body" style={styles.username}>
                        {user.username || '--'}
                    </CustomText>
                    <CustomText variant="caption" style={styles.email}>
                        {user.email || '--'}
                    </CustomText>
                    
                    {isAlreadyAdmin ? (
                        <View style={styles.disabledBadge}>
                            <CustomText style={styles.disabledText}>
                                ALREADY ADMIN
                            </CustomText>
                        </View>
                    ) : (
                        <View style={styles.buttonWrapper}>
                            <CustomButton 
                                title="Make Admin" 
                                onPress={() => {
                                    onMakeAdminPress(user);
                                    setEmail('');
                                }}
                                variant="primary"
                                style={styles.makeAdminBtn}
                                textStyle={styles.makeAdminBtnText}
                            />
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (!isOwner) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader title="Personnel" onBackPress={onBackPress} />
                <View style={styles.unauthorized}>
                    <CustomIcon 
                        library="Feather" 
                        name="lock" 
                        size={48} 
                        color={Colors.GRAY_MEDIUM} 
                    />
                    <CustomText variant="h2" style={styles.unauthorizedTitle}>
                        Access Denied
                    </CustomText>
                    <CustomText style={styles.unauthorizedText}>
                        Only the business owner can assign new personnel.
                    </CustomText>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader title="Personnel" onBackPress={onBackPress} />

            <ResponsiveScrollView contentContainerStyle={styles.scrollContent}>
                
                <CustomText style={styles.subtitle}>
                    Search for a registered user by email to grant them admin privileges.
                </CustomText>

                <View style={styles.searchSection}>
                    <View style={styles.inputWrapper}>
                        <CustomTextInput
                            placeholder="user@example.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            style={styles.searchInput}
                            autoCapitalize="none"
                        />
                    </View>
                    <TouchableOpacity 
                        style={[
                            styles.searchBtn, 
                            isLoading && { opacity: 0.5 }
                        ]} 
                        onPress={handleSearch}
                        disabled={isLoading}
                    >
                        <CustomIcon 
                            library="Feather" 
                            name="search" 
                            size={20} 
                            color={Colors.WHITE} 
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.resultsSection}>
                    <CustomText variant="caption" style={styles.resultsTitle}>
                        Search Results
                    </CustomText>
                    
                    {searched.length > 0 ? (
                        searched.map((user) => <UserResultCard key={user.id} user={user} />)
                    ) : (
                        <View style={styles.emptyState}>
                            <CustomText style={styles.emptyText}>
                                {email ? "No user found." : "Enter an email to search."}
                            </CustomText>
                        </View>
                    )}
                </View>

            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

const dropShadow = Platform.select({
    ios: { 
        shadowColor: Colors.SHADOW, 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 4 
    },
    android: { elevation: 1 },
    web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)' }
});

const styles = StyleSheet.create({
    scrollContent: { 
        padding: 16, 
        paddingBottom: 40,
    },
    subtitle: { 
        color: Colors.TEXT_SECONDARY, 
        marginBottom: 24, 
        fontSize: 13,
    },
    searchSection: { 
        flexDirection: 'row', 
        alignItems: 'center',
        gap: 12, 
        marginBottom: 32,
    },
    inputWrapper: {
        flex: 1,
    },
    searchInput: { 
        marginBottom: 0, 
    },
    searchBtn: { 
        width: 54, 
        height: 54, 
        backgroundColor: Colors.PRIMARY, 
        borderRadius: 12, 
        justifyContent: 'center', 
        alignItems: 'center',
    },
    resultsSection: { 
        flex: 1,
    },
    resultsTitle: { 
        marginBottom: 12, 
        color: Colors.TEXT_SECONDARY, 
        textTransform: 'uppercase', 
        fontWeight: 'bold', 
        fontSize: 12,
    },
    card: { 
        flexDirection: 'row', 
        backgroundColor: Colors.WHITE, 
        padding: 16, 
        borderRadius: 12, 
        alignItems: 'flex-start', 
        gap: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT, 
        ...dropShadow,
    },
    avatar: { 
        width: 44, 
        height: 44, 
        borderRadius: 22, 
        backgroundColor: Colors.PRIMARY, 
        justifyContent: 'center', 
        alignItems: 'center',
    },
    adminInfo: { 
        flex: 1, 
        justifyContent: 'center',
    },
    username: { 
        color: Colors.TEXT_PRIMARY, 
        marginBottom: 2, 
        fontWeight: 'bold',
    },
    email: { 
        color: Colors.TEXT_SECONDARY, 
        marginBottom: 2,
    },
    buttonWrapper: {
        marginTop: 8,
    },
    makeAdminBtn: { 
        height: 36, 
        paddingHorizontal: 12, 
        borderRadius: 8,
    },
    makeAdminBtnText: { 
        fontSize: 12, 
        fontWeight: 'bold',
    },
    disabledBadge: { 
        alignSelf: 'flex-start', 
        backgroundColor: Colors.STATUS_APPROVED_BG, 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 4, 
        marginTop: 6,
    },
    disabledText: { 
        color: Colors.STATUS_APPROVED_TEXT, 
        fontSize: 10, 
        fontWeight: 'bold', 
        textTransform: 'uppercase',
    },
    emptyState: { 
        paddingVertical: 40, 
        alignItems: 'center',
    },
    emptyText: { 
        color: Colors.TEXT_PLACEHOLDER, 
        fontStyle: 'italic',
    },
    unauthorized: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 32,
    },
    unauthorizedTitle: {
        marginTop: 16,
    },
    unauthorizedText: { 
        color: Colors.TEXT_SECONDARY, 
        textAlign: 'center', 
        marginTop: 8,
    }
});

export default PersonnelWriteScreen;