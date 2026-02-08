import React from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomTextInput from '@/src/components/CustomTextInput';
import CustomText from '../../../components/CustomText';
import { Colors } from '../../../constants/colors';

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
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap: 8,
        zIndex: 10,
        elevation: 0,
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
        backgroundColor: Colors.SEARCH_BAR_BG,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
        backgroundColor: Colors.WHITE,
    },
    
    categoryContainer: {
        marginTop: 4, 
    },
    categoryScroll: {
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
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