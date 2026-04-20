import React from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';

import { Colors } from '@/src/constants/colors';

const CustomSearchBar = ({ 
    searchPlaceholder = "Search...",
    searchValue,
    onSearchChange,
    rightIconLibrary = "Feather",
    rightIconName,
    onRightButtonPress,
    tabs = [],
    activeTab,
    onTabSelect
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.searchRow}>
                <View style={styles.inputWrapper}>
                    <CustomTextInput
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChangeText={onSearchChange}
                        icon="search"
                        iconLibrary="Feather"
                        style={styles.searchInputContainer}
                        inputStyle={styles.searchInput}
                    />
                </View>
                
                {rightIconName && (
                    <TouchableOpacity 
                        style={styles.iconButton} 
                        onPress={onRightButtonPress}
                        activeOpacity={0.7}
                    >
                        <CustomIcon 
                            library={rightIconLibrary} 
                            name={rightIconName} 
                            size={24} 
                            color={Colors.PRIMARY} 
                        />
                    </TouchableOpacity>
                )}
            </View>

            {tabs.length > 0 && (
                <View style={styles.chipContainer}>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipScroll}
                    >
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab;
                            return (
                                <TouchableOpacity 
                                    key={tab} 
                                    onPress={() => onTabSelect(tab)}
                                    style={[
                                        styles.chip,
                                        isActive && styles.activeChip
                                    ]}
                                    activeOpacity={0.8}
                                >
                                    <CustomText style={[
                                        styles.chipText,
                                        isActive && styles.activeChipText
                                    ]}>
                                        {tab}
                                    </CustomText>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 8,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    inputWrapper: {
        flex: 1,
    },
    searchInputContainer: {
        marginBottom: 0,
    },
    searchInput: {
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    iconButton: {
        width: 54,
        height: 54,
        backgroundColor: Colors.WHITE,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    chipContainer: {
        borderRadius: 12,
    },
    chipScroll: {
        gap: 10,
    },
    chip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: Colors.CHIP_INACTIVE,
    },
    activeChip: {
        backgroundColor: Colors.CHIP_ACTIVE, 
    },
    chipText: {
        fontWeight: '500',
        color: Colors.TEXT_PRIMARY,
    },
    activeChipText: {
        color: Colors.TEXT_INVERSE,
        fontWeight: 'bold',
    },
});

export default CustomSearchBar;