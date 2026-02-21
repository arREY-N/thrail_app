import React from 'react';
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

const SearchBar = ({ 
    categories, 
    selectedCategory, 
    onSelectCategory,
    onFilterPress 
}) => {

    return (
        <View style={styles.headerControls}>
            <View style={styles.topControls}>
                
                <CustomTextInput
                    placeholder="Search Bar"
                    icon="search"
                    style={styles.searchInputContainer} 
                />
                
                <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
                    <CustomIcon 
                        library="Ionicons" 
                        name="filter" 
                        size={24} 
                        color={Colors.TEXT_PRIMARY} 
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.categoryContainer}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScroll}
                >
                    {categories.map((cat) => {
                        const isActive = selectedCategory === cat;
                        return (
                            <TouchableOpacity 
                                key={cat} 
                                onPress={() => onSelectCategory(cat)}
                                style={[
                                    styles.categoryChip,
                                    isActive && styles.activeChip
                                ]}
                            >
                                <CustomText style={[
                                    styles.categoryText,
                                    isActive && styles.activeCategoryText
                                ]}>
                                    {cat}
                                </CustomText>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerControls: {
        backgroundColor: Colors.BACKGROUND,
        paddingBottom: 16,
        paddingHorizontal: 16,
        gap: 8,
        zIndex: 10,
        elevation: 4,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 24,

        shadowColor: Colors.SHADOW, 
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderBottomWidth: 1,
        borderBottomColor: Colors.GRAY_LIGHT,
    },
    topControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, 
    },

    searchInputContainer: {
        flex: 1,
        marginBottom: 0,
    },
    filterButton: {
        width: 54,
        height: 54,
        backgroundColor: Colors.BACKGROUND,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    
    categoryContainer: {
        marginTop: 4, 
        borderRadius: 12,
    },
    categoryScroll: {
        gap: 8,
        borderRadius: 12,
    },
    categoryChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: Colors.CHIP_INACTIVE,
    },
    activeChip: {
        backgroundColor: Colors.CHIP_ACTIVE, 
    },
    categoryText: {
        fontWeight: '600',
        color: Colors.TEXT_PRIMARY,
    },
    activeCategoryText: {
        color: Colors.TEXT_INVERSE,
        fontWeight: '700',
    },
});

export default SearchBar;