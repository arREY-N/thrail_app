import React, { useMemo, useState } from 'react';
import {
    StyleSheet,
    View,
    useWindowDimensions
} from 'react-native';

import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import CustomHeader from '../../../components/CustomHeader';
import CustomText from '../../../components/CustomText';
import { Colors } from '../../../constants/colors';
import MountainCard from '../../Home/components/MountainCard';

import SearchBar from '@/src/features/Explore/components/SearchBar';

const ExploreScreen = ({ 
    trails, 
    onViewMountain 
}) => {

    const { width } = useWindowDimensions();
    
    const containerPadding = 16;
    const gap = 16;
    const availableWidth = width - (containerPadding * 2);

    let numColumns = 1;
    if (width >= 1200) numColumns = 4;
    else if (width >= 900) numColumns = 3;
    else if (width >= 600) numColumns = 2;

    const cardWidth = (availableWidth - (gap * (numColumns - 1))) / numColumns;

    const [selectedCategory, setSelectedCategory] = useState('All');
    const categories = ['All', 'Recommended', 'Nearby', 'Trending', 'Challenge'];

    const filteredTrails = useMemo(() => {
        if (!trails) return [];

        switch (selectedCategory) {
            case 'Recommended':
                return trails.filter(t => (t.score || t.rating) >= 4.6);
            case 'Nearby':
                return trails.filter(t => t.address?.includes('Rizal'));
            case 'Trending':
                return trails.slice(0, 3); 
            case 'Challenge':
                return trails.filter(t => t.elevation > 600 || t.length > 10);
            case 'All':
            default:
                return trails;
        }
    }, [selectedCategory, trails]);

    return (
        <View style={styles.container}>
            <CustomHeader 
                title="Explore"
                showDefaultIcons={true} 
            />

            <SearchBar 
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                onFilterPress={() => console.log('Filter Pressed')}
            />

            <ResponsiveScrollView 
                contentContainerStyle={styles.scrollContent}
            >
                <View style={[styles.listContainer, { gap }]}>
                    {filteredTrails.length > 0 ? (
                        filteredTrails.map((t) => (
                            <MountainCard 
                                key={t.id}
                                item={t}
                                onPress={() => onViewMountain(t.id)}
                                onDownload={() => console.log("Download", t.name)}
                                style={{ width: cardWidth }} 
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                             <CustomText style={{color: Colors.TEXT_SECONDARY}}>
                                No trails found for "{selectedCategory}".
                             </CustomText>
                        </View>
                    )}
                </View>

            </ResponsiveScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.BACKGROUND,
    },
    scrollContent: {
        paddingBottom: 32,
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row', 
        flexWrap: 'wrap',     
    },
    emptyState: {
        paddingTop: 40,
        alignItems: 'center',
        width: '100%'
    }
});

export default ExploreScreen;