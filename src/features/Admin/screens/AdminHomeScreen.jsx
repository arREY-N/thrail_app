import React from 'react';
import {
    Platform,
    StyleSheet,
    View
} from 'react-native';

import CustomButton from '@/src/components/CustomButton';
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { formatDate } from '@/src/core/utility/date';

const AdminHomeScreen = ({ 
    businessAccount, 
    onManageAdminsPress, 
    onManageOffersPress,
    adminProfile, 
    error,
    onBackPress 
}) => {
    
    const InfoRow = ({ icon, label, value }) => (
        <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
                <CustomIcon 
                    library="Feather" 
                    name={icon} 
                    size={16} 
                    color={Colors.PRIMARY} 
                />
            </View>
            <View style={styles.infoTextContainer}>
                <CustomText variant="caption" style={styles.infoLabel}>
                    {label}
                </CustomText>
                <CustomText variant="body" style={styles.infoValue}>
                    {value || 'N/A'}
                </CustomText>
            </View>
        </View>
    );

    const formatAdminName = () => {
        if (!adminProfile) return '--';
        const fullName = `${adminProfile.firstname || ''} ${adminProfile.lastname || ''}`.trim();
        return fullName.length > 0 ? fullName : 'N/A';
    };

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <CustomHeader 
                title="Admin Dashboard" 
                onBackPress={onBackPress} 
            />

            <ResponsiveScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <CustomText variant="h2" style={styles.pageTitle}>
                    Dashboard
                </CustomText>
                
                {error && (
                    <View style={styles.errorBox}>
                        <CustomText style={styles.errorText}>
                            {error}
                        </CustomText>
                    </View>
                )}

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <CustomIcon 
                            library="Feather" 
                            name="briefcase" 
                            size={18} 
                            color={Colors.TEXT_PRIMARY} 
                        />
                        <CustomText variant="body" style={styles.cardTitle}>
                            Business Profile
                        </CustomText>
                        <View style={[
                            styles.statusBadge, 
                            businessAccount?.active ? styles.statusActive : styles.statusArchived
                        ]}>
                            <CustomText style={styles.statusText}>
                                {businessAccount?.active ? 'Active' : 'Archived'}
                            </CustomText>
                        </View>
                    </View>
                    
                    <View style={styles.cardBody}>
                        <InfoRow 
                            icon="hash" 
                            label="Business Name" 
                            value={businessAccount?.name} 
                        />
                        <InfoRow 
                            icon="map-pin" 
                            label="Address" 
                            value={businessAccount?.address} 
                        />
                        <InfoRow 
                            icon="map" 
                            label="Serviced Location" 
                            value={businessAccount?.servicedLocation} 
                        />
                        <InfoRow 
                            icon="calendar" 
                            label="Established" 
                            value={businessAccount?.establishedOn ? formatDate(businessAccount.establishedOn) : 'N/A'} 
                        />
                        <InfoRow 
                            icon="check-circle" 
                            label="Approved" 
                            value={businessAccount?.createdAt ? formatDate(businessAccount.createdAt) : 'N/A'} 
                        />
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <CustomIcon 
                            library="Feather" 
                            name="user" 
                            size={18} 
                            color={Colors.TEXT_PRIMARY} 
                        />
                        <CustomText variant="body" style={styles.cardTitle}>
                            My Admin Info
                        </CustomText>
                    </View>
                    
                    <View style={styles.cardBody}>
                        <InfoRow 
                            icon="user" 
                            label="Name" 
                            value={formatAdminName()} 
                        />
                        <InfoRow 
                            icon="at-sign" 
                            label="Username" 
                            value={adminProfile?.username} 
                        />
                        <InfoRow 
                            icon="mail" 
                            label="Email" 
                            value={adminProfile?.email} 
                        />
                        <InfoRow 
                            icon="home" 
                            label="Address" 
                            value={adminProfile?.address} 
                        />
                    </View>
                </View>

                <CustomText variant="body" style={styles.actionTitle}>
                    Quick Actions
                </CustomText>
                
                <View style={styles.actionContainer}>
                    <CustomButton 
                        title="Manage Personnel"
                        onPress={onManageAdminsPress}
                        variant="secondary"
                        style={[
                            styles.actionBtn, 
                            { borderWidth: 1.5, borderColor: Colors.PRIMARY }
                        ]}
                        textStyle={{ color: Colors.PRIMARY }}
                    />
                    <CustomButton 
                        title="Manage Offers"
                        onPress={onManageOffersPress}
                        variant="primary"
                        style={styles.actionBtn}
                    />
                </View>

            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

const dropShadow = Platform.select({
    ios: { 
        shadowColor: Colors.SHADOW, 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.04, 
        shadowRadius: 6 
    },
    android: { 
        elevation: 2 
    },
    web: { 
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)' 
    }
});

const styles = StyleSheet.create({
    scrollContent: { 
        padding: 16, 
        paddingBottom: 40, 
        gap: 16 
    },
    pageTitle: { 
        marginBottom: 8, 
        color: Colors.TEXT_PRIMARY 
    },
    
    errorBox: { 
        backgroundColor: '#FFEBEE', 
        padding: 12, 
        borderRadius: 8, 
        marginBottom: 16 
    },
    errorText: { 
        color: Colors.ERROR, 
        fontWeight: '500' 
    },
    
    card: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 16, 
        padding: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT, 
        ...dropShadow 
    },
    cardHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8, 
        marginBottom: 20 
    },
    cardTitle: { 
        color: Colors.TEXT_PRIMARY 
    },
    cardBody: { 
        gap: 20 
    },
    
    infoRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 16 
    },
    iconCircle: { 
        width: 36, 
        height: 36, 
        borderRadius: 18, 
        backgroundColor: '#E8F5E9', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    infoTextContainer: { 
        flex: 1, 
        justifyContent: 'center' 
    },
    infoLabel: { 
        color: Colors.TEXT_SECONDARY, 
        fontSize: 12, 
        marginBottom: 2 
    },
    infoValue: { 
        color: Colors.TEXT_PRIMARY, 
        fontSize: 14, 
        fontWeight: '500' 
    },
    
    statusBadge: { 
        marginLeft: 'auto', 
        paddingHorizontal: 12, 
        paddingVertical: 4, 
        borderRadius: 8 
    },
    statusActive: { 
        backgroundColor: '#E8F5E9' 
    },
    statusArchived: { 
        backgroundColor: Colors.GRAY_LIGHT 
    },
    statusText: { 
        fontSize: 12, 
        fontWeight: 'bold', 
        color: Colors.PRIMARY 
    },

    actionTitle: { 
        marginTop: 8, 
        marginBottom: -4, 
        color: Colors.TEXT_PRIMARY,
        fontSize: 14,
    },
    actionContainer: { 
        gap: 12 
    },
    actionBtn: { 
        height: 54 
    },
});

export default AdminHomeScreen;