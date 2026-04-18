import React, { useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import CustomTextInput from '@/src/components/CustomTextInput';

import { Colors } from '@/src/constants/colors';

const MountainSelectChip = ({ options = [], selectedValues = [], onToggle }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);

    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) return options;
        return options.filter(opt => 
            opt.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [options, searchQuery]);

    const isExactMatch = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true; 
        
        const inOptions = options.some(opt => opt.toLowerCase() === query);
        const inSelected = selectedValues.some(val => val.toLowerCase() === query);
        
        return inOptions || inSelected;
    }, [options, selectedValues, searchQuery]);

    const handleAddCustom = () => {
        const trimmed = searchQuery.trim();
        if (trimmed && !selectedValues.includes(trimmed)) {
            onToggle(trimmed);
            setSearchQuery('');
        }
    };

    const handleScroll = (event) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToRight = 20;
        setIsScrolledToEnd(layoutMeasurement.width + contentOffset.x >= contentSize.width - paddingToRight);
    };

    return (
        <View style={styles.container}>
            
            <CustomTextInput
                placeholder="Search or add a mountain..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                icon="search"
                iconLibrary="Ionicons"
                style={styles.searchInput}
            />

            {selectedValues.length > 0 && (
                <View style={styles.chipScrollWrapper}>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipContainer}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    >
                        {selectedValues.map((value) => (
                            <TouchableOpacity 
                                key={`chip-${value}`} 
                                style={styles.chip}
                                onPress={() => onToggle(value)}
                                activeOpacity={0.7}
                            >
                                <CustomText variant="caption" style={styles.chipText}>{value}</CustomText>
                                <CustomIcon name="close" library="Ionicons" size={16} color={Colors.PRIMARY} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {!isScrolledToEnd && selectedValues.length > 2 && (
                        <View style={styles.scrollIndicator} pointerEvents="none">
                            <CustomIcon 
                                name="chevron-forward" 
                                library="Ionicons" 
                                size={20} 
                                color={Colors.GRAY_MEDIUM} 
                            />
                        </View>
                    )}
                </View>
            )}

            <View style={styles.listWrapper}>
                <ScrollView 
                    style={styles.listScroll} 
                    nestedScrollEnabled={true} 
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                >
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => {
                            const isSelected = selectedValues.includes(opt);
                            return (
                                <TouchableOpacity 
                                    key={opt} 
                                    style={[styles.listItem, isSelected && styles.listItemSelected]} 
                                    onPress={() => onToggle(opt)}
                                    activeOpacity={0.7}
                                >
                                    <CustomIcon 
                                        name={isSelected ? "checkbox" : "square-outline"} 
                                        library="Ionicons"
                                        color={isSelected ? Colors.PRIMARY : Colors.GRAY_MEDIUM} 
                                        size={22}
                                    />
                                    <CustomText style={[styles.listText, isSelected && styles.listTextSelected]}>
                                        {opt}
                                    </CustomText>
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        !searchQuery.trim() && (
                            <View style={styles.emptyContainer}>
                                <CustomText style={styles.emptyText}>Type to search or add a custom mountain.</CustomText>
                            </View>
                        )
                    )}

                    {searchQuery.trim() !== '' && !isExactMatch && (
                        <TouchableOpacity 
                            style={styles.addCustomItem} 
                            onPress={handleAddCustom}
                            activeOpacity={0.7}
                        >
                            <CustomIcon 
                                name="add-circle" 
                                library="Ionicons" 
                                color={Colors.PRIMARY} 
                                size={22} 
                            />
                            <CustomText style={styles.addCustomText}>
                                Add "{searchQuery.trim()}"
                            </CustomText>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    searchInput: {
        marginBottom: 12,
    },
    chipScrollWrapper: {
        marginBottom: 16,
        position: 'relative',
    },
    scrollIndicator: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 32,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    chipContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingRight: 32,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.STATUS_APPROVED_BG,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 24,
        gap: 6,
        borderWidth: 1,
        borderColor: Colors.STATUS_APPROVED_BORDER,
    },
    chipText: {
        color: Colors.PRIMARY,
        fontWeight: '600',
    },
    listWrapper: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        overflow: 'hidden',
        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3, 
    },
    listScroll: {
        maxHeight: 320, 
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_ULTRALIGHT,
        gap: 12,
    },
    listItemSelected: {
        backgroundColor: Colors.BACKGROUND,
    },
    listText: {
        flex: 1,
        color: Colors.TEXT_PRIMARY,
    },
    listTextSelected: {
        color: Colors.PRIMARY,
        fontWeight: 'bold',
    },
    addCustomItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.STATUS_APPROVED_BG,
        gap: 12,
    },
    addCustomText: {
        flex: 1,
        color: Colors.PRIMARY,
        fontWeight: 'bold',
        fontStyle: 'italic',
    },
    emptyContainer: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        color: Colors.TEXT_SECONDARY,
        fontStyle: 'italic',
    }
});

export default MountainSelectChip;