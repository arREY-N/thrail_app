/**
 * @file PersonnelWriteScreen.tsx
 * @description Admin screen to search and add new personnel via email. Allows business owners to lookup registered users and grant them admin privileges.
 */

import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import ErrorMessage from '@/src/components/ErrorMessage';

import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { IAdmin } from '@/src/core/models/Admin/Admin.types';
import { User } from '@/src/core/models/User/User';
import { getInitials } from '@/src/utils/dateFormatter';

/**
 * Interface representing the properties of the PersonnelWriteScreen component.
 * 
 * @param businessAdmins - The array of current business admins.
 * @param onFindUserPress - Callback handler to search for a user by email.
 * @param searched - The array of search results matching the query.
 * @param onMakeAdminPress - Callback handler to promote a user to business admin.
 * @param isOwner - Flag indicating if the current user is the business owner.
 * @param isLoading - Flag indicating if a search or action is in progress.
 * @param onBackPress - Callback handler to navigate back.
 */
export interface PersonnelWriteScreenProps {
    businessAdmins: IAdmin[];
    onFindUserPress: (email: string) => void;
    searched: User[];
    onMakeAdminPress: (user: User) => void | Promise<void>;
    isOwner: boolean;
    isLoading: boolean;
    error?: string;
    success?: string;
    onBackPress: () => void;
}

/**
 * PersonnelWriteScreen — Admin screen to search and add new personnel via email.
 */
const PersonnelWriteScreen: React.FC<PersonnelWriteScreenProps> = ({
    businessAdmins,
    onFindUserPress,
    searched,
    onMakeAdminPress,
    isOwner,
    isLoading,
    error,
    success,
    onBackPress 
}) => {
    const [email, setEmail] = useState<string>('');

    const handleSearch = () => {
        if (email.trim()) onFindUserPress(email);
    };

    const UserResultCard = ({ user }: { user: User }) => {
        const isSystemAdmin = user.role === 'admin';
        const isBusinessAdmin = Array.isArray(businessAdmins) && businessAdmins.some((admin) => admin.id === user.id);
        const isAlreadyAdmin = isSystemAdmin || isBusinessAdmin;
        
        const fullName = (user.firstname || user.lastname) 
            ? `${user.firstname || ''} ${user.lastname || ''}`.trim() 
            : '--';
        const initials = getInitials(fullName !== '--' ? fullName : user.username);

        return (
            <View style={styles.card}>
                <View style={styles.avatar}>
                    <CustomText style={styles.avatarText}>
                        {initials}
                    </CustomText>
                </View>
                
                <View style={styles.adminInfo}>
                    <CustomText variant="body" style={styles.username} numberOfLines={1}>
                        {user.username || '--'}
                    </CustomText>
                    <CustomText variant="caption" style={styles.email} numberOfLines={1}>
                        {user.email || '--'}
                    </CustomText>
                </View>

                <View style={styles.actionWrapper}>
                    {isAlreadyAdmin ? (
                        <View style={styles.disabledBadge}>
                            <CustomText style={styles.disabledText}>
                                ALREADY ADMIN
                            </CustomText>
                        </View>
                    ) : (
                        <CustomButton 
                            title={isLoading ? "Promoting..." : "Make Admin"} 
                            onPress={() => {
                                onMakeAdminPress(user);
                                setEmail('');
                            }}
                            disabled={isLoading}
                            variant="primary"
                            style={styles.makeAdminBtn}
                            textStyle={styles.makeAdminBtnText}
                        />
                    )}
                </View>
            </View>
        );
    };

    if (!isOwner) {
        return (
            <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
                <CustomHeader title="Personnel" centerTitle={true} onBackPress={onBackPress} />
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
            <CustomHeader title="Personnel" centerTitle={true} onBackPress={onBackPress} />

            <ResponsiveScrollView contentContainerStyle={styles.scrollContent}>
                
                <View style={styles.constrainer}>
                    <ErrorMessage error={error} />
                    
                    {success ? (
                        <View style={styles.successContainer}>
                            <CustomIcon 
                                library="Feather" 
                                name="check-circle" 
                                size={18} 
                                color={Colors.STATUS_APPROVED_TEXT} 
                                style={styles.successIcon}
                            />
                            <View style={styles.successTextContainer}>
                                <CustomText variant="caption" style={styles.successText}>
                                    {success}
                                </CustomText>
                            </View>
                        </View>
                    ) : null}

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
                                <CustomIcon 
                                    library="Feather" 
                                    name={email ? "user-x" : "mail"} 
                                    size={40} 
                                    color={Colors.GRAY_MEDIUM} 
                                />
                                <CustomText style={styles.emptyText}>
                                    {email ? "No user found." : "Enter an email to search."}
                                </CustomText>
                            </View>
                        )}
                    </View>
                </View>

            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: { 
        padding: 16, 
        paddingBottom: 40,
    },

    constrainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH, 
        alignSelf: 'center',
        flex: 1,
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
        borderRadius: 16, 
        alignItems: 'center', 
        gap: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT, 
        ...GlobalStyles.dropShadow(3),
    },
    avatar: { 
        width: 44, 
        height: 44, 
        borderRadius: 22, 
        backgroundColor: Colors.PRIMARY, 
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.STATUS_APPROVED_BG,
    },
    avatarText: {
        color: Colors.WHITE,
        fontWeight: 'bold',
        fontSize: 16,
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
    actionWrapper: {
        justifyContent: 'center',
        alignItems: 'flex-end',
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
        backgroundColor: Colors.STATUS_APPROVED_BG, 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 4, 
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
        gap: 12,
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
        paddingBottom: 80, 
    },
    unauthorizedTitle: {
        marginTop: 16,
    },
    unauthorizedText: { 
        color: Colors.TEXT_SECONDARY, 
        textAlign: 'center', 
        marginTop: 8,
    },
    successContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.STATUS_APPROVED_BG, 
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,    
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        width: '100%',
        gap: 8,
    },
    successIcon: {
        marginTop: 2,
    },
    successTextContainer: {
        flex: 1,
    },
    successText: {
        color: Colors.STATUS_APPROVED_TEXT,
        fontWeight: '500',
        lineHeight: 20,
    },
});

export default PersonnelWriteScreen;
