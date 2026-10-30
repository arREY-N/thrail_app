/**
 * @file AboutScreen.tsx
 * @description View that displays information about the application and the developers.
 */
import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomImage from '@/src/components/CustomImage';
import CustomText from '@/src/components/CustomText';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { BRAND } from '@/src/constants/branding';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';
import { THRAIL_DEVELOPERS } from '@/src/constants/team';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

/**
 * Props for the AboutScreen component
 * @param onBackPress - Callback to navigate back
 * @param onHelpPress - Callback to navigate to help screen
 * @param onTerms - Callback to navigate to terms screen
 * @param onPrivacy - Callback to navigate to privacy screen
 */
export interface AboutScreenProps {
    onBackPress: () => void;
    onHelpPress: () => void;
    onTerms: () => void;
    onPrivacy: () => void;
    onPolicies?: () => void;
}

/**
 * AboutScreen displays informational details about the application version, scope, and the development team.
 */
const AboutScreen = ({ 
    onBackPress,
    onHelpPress,
    onTerms,
    onPrivacy,
    onPolicies
}: AboutScreenProps) => {
    const { isMobile } = useBreakpoints();

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <CustomHeader title="About Thrail" centerTitle onBackPress={onBackPress} />
            <ScrollView contentContainerStyle={[styles.content, !isMobile && styles.desktopContent]} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.logoBadgeContainer}>
                        <CustomImage
                            source={BRAND.ASSETS.CIRCLE_LOGO}
                            style={styles.brandLogo}
                            resizeMode="contain"
                        />
                    </View>
                    <CustomText variant="h2" style={styles.appName}>Thrail</CustomText>
                    <CustomText variant="caption" style={styles.version}>Version 1.0.0</CustomText>
                    <CustomText variant="body" style={styles.description}>
                        Your ultimate companion for exploring the beautiful trails of Region IV-A CALABARZON.
                    </CustomText>
                </View>

                {/* Team Section */}
                <View style={styles.section}>
                    <CustomText variant="h3" style={styles.sectionTitle}>Meet The Team</CustomText>
                    <View style={styles.grid}>
                        {THRAIL_DEVELOPERS.map((dev) => (
                            <View key={dev.id} style={[styles.devCard, !isMobile && styles.devCardDesktop]}>
                                <View style={styles.avatarPlaceholder}>
                                    <CustomIcon library="Feather" name="user" size={24} color={Colors.PRIMARY} />
                                </View>
                                <View style={styles.nameContainer}>
                                    <CustomText 
                                        variant="body" 
                                        style={styles.devName}
                                        numberOfLines={2}
                                        adjustsFontSizeToFit={true}
                                        minimumFontScale={0.85}
                                    >
                                        {dev.name}
                                    </CustomText>
                                </View>
                                <View style={styles.roleContainer}>
                                    <CustomText 
                                        variant="caption" 
                                        style={styles.devRole}
                                        numberOfLines={2}
                                    >
                                        {dev.role}
                                    </CustomText>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Resources & Legal Section */}
                <View style={styles.section}>
                    <CustomText variant="h3" style={styles.sectionTitle}>Resources & Legal</CustomText>
                    
                    <TouchableOpacity 
                        style={styles.rowCard} 
                        onPress={onHelpPress}
                        activeOpacity={0.7}
                    >
                        <View style={styles.rowLeft}>
                            <View style={styles.iconWrapper}>
                                <CustomIcon library="Feather" name="help-circle" size={20} color={Colors.PRIMARY} />
                            </View>
                            <CustomText variant="body" style={styles.rowTitle}>Help & Support</CustomText>
                        </View>
                        <CustomIcon library="Feather" name="chevron-right" size={20} color={Colors.GRAY_MEDIUM} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.rowCard} 
                        onPress={onTerms}
                        activeOpacity={0.7}
                    >
                        <View style={styles.rowLeft}>
                            <View style={styles.iconWrapper}>
                                <CustomIcon library="Feather" name="file-text" size={20} color={Colors.PRIMARY} />
                            </View>
                            <CustomText variant="body" style={styles.rowTitle}>Terms & Conditions</CustomText>
                        </View>
                        <CustomIcon library="Feather" name="chevron-right" size={20} color={Colors.GRAY_MEDIUM} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.rowCard} 
                        onPress={onPrivacy}
                        activeOpacity={0.7}
                    >
                        <View style={styles.rowLeft}>
                            <View style={styles.iconWrapper}>
                                <CustomIcon library="Feather" name="file-text" size={20} color={Colors.PRIMARY} />
                            </View>
                            <CustomText variant="body" style={styles.rowTitle}>Privacy Policy</CustomText>
                        </View>
                        <CustomIcon library="Feather" name="chevron-right" size={20} color={Colors.GRAY_MEDIUM} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.rowCard} 
                        onPress={onPolicies}
                        activeOpacity={0.7}
                    >
                        <View style={styles.rowLeft}>
                            <View style={styles.iconWrapper}>
                                <CustomIcon library="Feather" name="briefcase" size={20} color={Colors.PRIMARY} />
                            </View>
                            <CustomText variant="body" style={styles.rowTitle}>Booking & Organizer Policies</CustomText>
                        </View>
                        <CustomIcon library="Feather" name="chevron-right" size={20} color={Colors.GRAY_MEDIUM} />
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: 20,
        gap: 32,
        alignItems: 'center',
        paddingBottom: 48,
    },
    desktopContent: {
        alignSelf: 'center',
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
    },
    header: {
        alignItems: 'center',
        gap: 8,
        marginTop: 0,
    },
    logoBadgeContainer: {
        width: 88,
        height: 88,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    brandLogo: {
        width: 88,
        height: 88,
    },
    appName: {
        fontWeight: 'bold',
        color: Colors.BLACK,
        marginBottom: 0,
    },
    version: {
        color: Colors.GRAY_MEDIUM,
    },
    description: {
        textAlign: 'center',
        color: Colors.GRAY,
        marginTop: 8,
        paddingHorizontal: 20,
    },
    section: {
        width: '100%',
        gap: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.BLACK,
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'center',
    },
    devCard: {
        width: '45%',
        backgroundColor: Colors.WHITE,
        padding: 16,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: 184,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        ...GlobalStyles.dropShadow(2),
    },
    devCardDesktop: {
        width: '22%',
        minHeight: 188,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.BUTTON_OUTLINE_BG,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    nameContainer: {
        height: 42,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginBottom: 4,
    },
    devName: {
        fontWeight: 'bold',
        color: Colors.BLACK,
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 18,
    },
    roleContainer: {
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    devRole: {
        color: Colors.TEXT_PLACEHOLDER,
        textAlign: 'center',
        fontSize: 12,
        lineHeight: 16,
    },
    rowCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.WHITE,
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.GRAY_ULTRALIGHT,
        gap: 16,
        width: '100%',
        ...GlobalStyles.dropShadow(2),
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.BUTTON_OUTLINE_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowTitle: {
        fontWeight: 'bold',
        color: Colors.BLACK,
        fontSize: 15,
    },
});

export default AboutScreen;
