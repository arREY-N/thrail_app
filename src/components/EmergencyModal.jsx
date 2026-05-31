import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput, { cleanPhoneNumber } from '@/src/components/CustomTextInput';
import ErrorMessage from '@/src/components/ErrorMessage';
import { Colors } from '@/src/constants/colors';
import { useEmergencyContact } from "@/src/core/hook/user/useEmergencyContact";
import { useAuthStore } from '@/src/core/stores/authStores/authStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const dropShadow = Platform.select({ 
    ios: { 
        shadowColor: Colors.SHADOW, 
        shadowOffset: { 
            width: 0, 
            height: -4 
        }, 
        shadowOpacity: 0.1, 
        shadowRadius: 12 
    }, 
    android: { 
        elevation: 8 
    } 
});

const EmergencyModal = ({ 
    visible, 
    onClose, 
    mode = 'emergency_only', 
    initialUserPhone = '', 
    onSaveLocalPhone, 
    onSkip 
}) => {
    const { profile } = useAuthStore();
    const { findUser, setEmergencyContact, localError } = useEmergencyContact();

    const [myPhone, setMyPhone] = useState(initialUserPhone);
    const [searchEmail, setSearchEmail] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);
    const [contactName, setContactName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [errorMsg, setErrorMsg] = useState(null);
    const [infoMsg, setInfoMsg] = useState(null);

    const [renderModal, setRenderModal] = useState(visible);
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setRenderModal(true);
            
            setMyPhone(initialUserPhone);
            setSearchResults([]);
            setShowDropdown(false);
            setErrorMsg(null);
            setInfoMsg(null);
            
            setSearchEmail(profile?.emergencyContact?.email || '');
            setSelectedUser(
                profile?.emergencyContact?.userId 
                    ? { 
                        id: profile.emergencyContact.userId, 
                        email: profile.emergencyContact.email 
                    } 
                    : null
            );
            setContactName(profile?.emergencyContact?.name || '');
            setContactPhone(profile?.emergencyContact?.contactNumber || '');

            Animated.timing(animValue, {
                toValue: 1,
                duration: 300,
                useNativeDriver: Platform.OS !== 'web',
            }).start();
        } else {
            Animated.timing(animValue, {
                toValue: 0,
                duration: 250,
                useNativeDriver: Platform.OS !== 'web',
            }).start(() => setRenderModal(false));
        }
    }, [visible, initialUserPhone, profile, animValue]);

    const handleCloseOrSkip = () => {
        setErrorMsg(null);
        setInfoMsg(null);
        if (mode === 'emergency_only' && onSkip) {
            onSkip();
        } else if (onClose) {
            onClose();
        }
    };

    const handleEmailChange = (text) => {
        setSearchEmail(text);
        setShowDropdown(false);
        setErrorMsg(null);
        setInfoMsg(null);
        
        if (selectedUser && text.trim().toLowerCase() !== (selectedUser.email || '').toLowerCase()) {
            setSelectedUser(null);
        }
    };

    const handleSearch = async () => {
        setErrorMsg(null);
        setInfoMsg(null);
        const cleanedSearch = searchEmail.trim().toLowerCase();
        
        if (!cleanedSearch) return;
        
        if (cleanedSearch === profile?.email?.trim().toLowerCase()) {
            setErrorMsg("You cannot use your own email as an emergency contact.");
            return;
        }

        setIsSearching(true);
        setShowDropdown(false);
        
        try {
            const results = await findUser(cleanedSearch);
            
            if (!results || results.length === 0) {
                setInfoMsg("No Thrail account found with this email. Please provide the contact name and phone number, we will save this as an external SMS contact.");
                setSelectedUser(null);
            } else if (results.length === 1) {
                handleSelectUser(results[0]);
            } else {
                setSearchResults(results);
                setShowDropdown(true);
            }
        } catch (error) {
            setErrorMsg("Could not connect to the server. Please try again.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setSearchEmail(user.email);
        setContactName(`${user.firstname} ${user.lastname}`.trim());
        setShowDropdown(false);
        setErrorMsg(null);

        if (user.phoneNumber) {
            setContactPhone(user.phoneNumber);
            setInfoMsg(`Successfully linked to ${user.firstname}!`);
        } else {
            setContactPhone('');
            setInfoMsg(`We found ${user.firstname}, but their profile is missing a phone number. Please provide it below.`);
        }
    };

    const handleSave = async () => {
        setErrorMsg(null);
        setInfoMsg(null);

        const cleanedContactName = contactName.trim();
        const cleanedContactPhone = cleanPhoneNumber(contactPhone);
        const cleanedMyPhone = cleanPhoneNumber(myPhone);

        if (!cleanedContactName || !cleanedContactPhone) {
            setErrorMsg("Please provide both the name and contact number for your emergency contact.");
            return;
        }
        if (cleanedContactPhone.length < 10) {
            setErrorMsg("Please enter a valid emergency contact phone number.");
            return;
        }
        if (mode === 'unified') {
            if (!cleanedMyPhone || cleanedMyPhone.length < 10) {
                setErrorMsg("Please enter a valid phone number for yourself.");
                return;
            }
            if (cleanedMyPhone === cleanedContactPhone) {
                setErrorMsg("Your emergency contact number cannot be exactly the same as your own number.");
                return;
            }
        }

        setIsSaving(true);
        const contactPayload = {
            name: cleanedContactName,
            contactNumber: cleanedContactPhone,
            userId: selectedUser ? selectedUser.id : '',
            email: selectedUser ? selectedUser.email : ''
        };

        const success = await setEmergencyContact(contactPayload, selectedUser);
        setIsSaving(false);

        if (success) {
            if (mode === 'unified' && onSaveLocalPhone) {
                onSaveLocalPhone(cleanedMyPhone);
            }
            if (onClose) onClose();
        } else {
            setErrorMsg(localError || "Failed to save. Check your connection.");
        }
    };

    if (!renderModal) return null;

    return (
        <Modal 
            visible={renderModal} 
            transparent 
            animationType="none" 
            onRequestClose={handleCloseOrSkip}
        >
            <KeyboardAvoidingView 
                style={styles.modalContainer} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                
                {/* Animated Background Overlay */}
                <Animated.View style={[styles.backdrop, { opacity: animValue }]}>
                    <TouchableOpacity 
                        style={styles.backdropTouch} 
                        activeOpacity={1} 
                        onPress={handleCloseOrSkip} 
                    />
                </Animated.View>

                <Animated.View 
                    style={[
                        styles.bottomSheet,
                        {
                            transform: [
                                {
                                    translateY: animValue.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [SCREEN_HEIGHT, 0]
                                    })
                                }
                            ]
                        }
                    ]}
                >
                    <View style={styles.dragHandle} />
                    
                    <View style={styles.headerRow}>
                        <CustomText variant="h2" style={styles.headerTitle}>
                            {mode === 'unified' ? "Edit Contacts" : "Emergency Setup"}
                        </CustomText>
                        <TouchableOpacity 
                            onPress={handleCloseOrSkip} 
                            style={styles.closeBtn} 
                            disabled={isSaving}
                        >
                            <CustomIcon 
                                library="Feather" 
                                name="x" 
                                size={20} 
                                color={Colors.TEXT_SECONDARY} 
                            />
                        </TouchableOpacity>
                    </View>

                    <ScrollView 
                        showsVerticalScrollIndicator={false} 
                        keyboardShouldPersistTaps="handled"
                    >

                        {mode === 'unified' && (
                            <View style={styles.section}>
                                <CustomText style={styles.sectionTitle}>
                                    Your Phone Number
                                </CustomText>
                                <CustomText style={styles.sectionSubtitle}>
                                    For your guide to reach you during this hike.
                                </CustomText>
                                <CustomTextInput 
                                    label="Phone Number" 
                                    placeholder="9XX XXX XXXX" 
                                    prefix="+63" 
                                    type="phone" 
                                    value={myPhone} 
                                    keyboardType="number-pad" 
                                    onChangeText={setMyPhone} 
                                    maxLength={12} 
                                />
                            </View>
                        )}

                        <View 
                            style={[
                                styles.section, 
                                { 
                                    borderTopWidth: mode === 'unified' ? 1 : 0, 
                                    borderColor: Colors.GRAY_ULTRALIGHT, 
                                    paddingTop: mode === 'unified' ? 16 : 0
                                }
                            ]}
                        >
                            <CustomText style={styles.sectionTitle}>
                                Emergency Contact
                            </CustomText>
                            <CustomText style={styles.sectionSubtitle}>
                                Link a Thrail user to unlock the automated SOS Group Chat.
                            </CustomText>
                            
                            <View style={styles.searchRow}>
                                <View style={{ flex: 1 }}>
                                    <CustomTextInput 
                                        label="Search by Email (Optional)" 
                                        placeholder="friend@email.com" 
                                        value={searchEmail} 
                                        onChangeText={handleEmailChange} 
                                        keyboardType="email-address" 
                                        autoCapitalize="none"
                                    />
                                </View>
                                <TouchableOpacity 
                                    style={styles.searchBtn} 
                                    onPress={handleSearch} 
                                    disabled={isSearching}
                                >
                                    {isSearching ? (
                                        <ActivityIndicator 
                                            color={Colors.WHITE} 
                                            size="small" 
                                        />
                                    ) : (
                                        <CustomIcon 
                                            library="Feather" 
                                            name="search" 
                                            size={20} 
                                            color={Colors.WHITE} 
                                        />
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.alertContainer}>
                                {errorMsg ? (
                                    <ErrorMessage 
                                        error={errorMsg} 
                                        style={{ marginBottom: 12, width: '100%' }} 
                                    />
                                ) : null}
                                {infoMsg ? (
                                    <View style={styles.infoBox}>
                                        <CustomIcon 
                                            library="Feather" 
                                            name="info" 
                                            size={16} 
                                            color={Colors.PRIMARY} 
                                        />
                                        <CustomText style={styles.infoText}>
                                            {infoMsg}
                                        </CustomText>
                                    </View>
                                ) : null}
                            </View>

                            {showDropdown && searchResults.length > 0 && (
                                <View style={styles.dropdown}>
                                    {searchResults.map((user) => (
                                        <TouchableOpacity 
                                            key={user.id} 
                                            style={styles.dropdownItem} 
                                            onPress={() => handleSelectUser(user)}
                                        >
                                            <View style={styles.dropdownAvatar}>
                                                <CustomIcon 
                                                    library="Feather" 
                                                    name="user" 
                                                    size={16} 
                                                    color={Colors.PRIMARY} 
                                                />
                                            </View>
                                            <View>
                                                <CustomText style={styles.dropdownName}>
                                                    {user.firstname} {user.lastname}
                                                </CustomText>
                                                <CustomText style={styles.dropdownEmail}>
                                                    {user.email}
                                                </CustomText>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            <View style={styles.inputSpacing}>
                                <CustomTextInput 
                                    label="Contact Name" 
                                    placeholder="Maria Dela Cruz" 
                                    value={contactName} 
                                    onChangeText={setContactName} 
                                />
                            </View>
                            
                            <View style={styles.inputSpacing}>
                                <CustomTextInput 
                                    label="Contact Phone Number" 
                                    placeholder="9XX XXX XXXX" 
                                    prefix="+63" 
                                    type="phone" 
                                    value={contactPhone} 
                                    keyboardType="number-pad" 
                                    onChangeText={setContactPhone} 
                                    maxLength={12} 
                                />
                            </View>
                        </View>
                    </ScrollView>

                    <TouchableOpacity 
                        style={[
                            styles.saveBtn, 
                            isSaving && { opacity: 0.7 }
                        ]} 
                        onPress={handleSave} 
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color={Colors.WHITE} />
                        ) : (
                            <CustomText style={styles.saveBtnText}>
                                Save & Apply
                            </CustomText>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: { 
        flex: 1, 
        justifyContent: 'flex-end' 
    },
    backdrop: { 
        ...StyleSheet.absoluteFillObject, 
        backgroundColor: 'rgba(0,0,0,0.4)' 
    },
    backdropTouch: { 
        flex: 1, 
        width: '100%' 
    },
    bottomSheet: { 
        backgroundColor: Colors.WHITE, 
        borderTopLeftRadius: 32, 
        borderTopRightRadius: 32, 
        paddingHorizontal: 24, 
        paddingBottom: 32, 
        paddingTop: 12, 
        maxHeight: '90%', 
        ...dropShadow 
    },
    dragHandle: { 
        width: 40, 
        height: 5, 
        borderRadius: 3, 
        backgroundColor: Colors.GRAY_LIGHT, 
        alignSelf: 'center', 
        marginBottom: 16 
    },
    headerRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24 
    },
    headerTitle: { 
        marginBottom: 0 
    },
    closeBtn: { 
        padding: 8, 
        backgroundColor: Colors.GRAY_ULTRALIGHT, 
        borderRadius: 20 
    },
    section: { 
        marginBottom: 4 
    },
    sectionTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: Colors.TEXT_PRIMARY, 
        marginBottom: 4 
    },
    sectionSubtitle: { 
        fontSize: 13, 
        color: Colors.TEXT_SECONDARY, 
        marginBottom: 20, 
        lineHeight: 18 
    },
    searchRow: { 
        flexDirection: 'row', 
        alignItems: 'flex-start', 
        gap: 12, 
        marginBottom: 0, 
        zIndex: 10 
    },
    searchBtn: { 
        backgroundColor: Colors.PRIMARY, 
        height: 50, 
        width: 52, 
        borderRadius: 16, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: 28 
    },
    alertContainer: { 
        width: '100%' 
    },
    dropdown: { 
        backgroundColor: Colors.WHITE, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_ULTRALIGHT, 
        marginBottom: 20, 
        overflow: 'hidden', 
        ...dropShadow 
    },
    dropdownItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: Colors.GRAY_ULTRALIGHT, 
        gap: 12 
    },
    dropdownAvatar: { 
        width: 36, 
        height: 36, 
        borderRadius: 18, 
        backgroundColor: '#E8F5E9', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    dropdownName: { 
        fontSize: 15, 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: 'bold' 
    },
    dropdownEmail: { 
        fontSize: 12, 
        color: Colors.TEXT_SECONDARY, 
        marginTop: 2 
    },
    inputSpacing: { 
        marginBottom: 0 
    },
    saveBtn: { 
        backgroundColor: Colors.PRIMARY, 
        height: 56, 
        borderRadius: 16, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: 12 
    },
    saveBtnText: { 
        color: Colors.WHITE, 
        fontWeight: 'bold', 
        fontSize: 16 
    },
    infoBox: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#E8F5E9', 
        padding: 12, 
        borderRadius: 12, 
        marginBottom: 16, 
        borderWidth: 1, 
        borderColor: '#C8E6C9', 
        gap: 8, 
        width: '100%' 
    },
    infoText: { 
        color: Colors.PRIMARY, 
        fontSize: 13, 
        flex: 1, 
        fontWeight: '500' 
    }
});

export default EmergencyModal;