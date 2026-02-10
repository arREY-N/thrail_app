import React, { useMemo, useState } from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import SearchBar from '@/src/features/Explore/components/SearchBar';
import MountainCard from '@/src/features/Home/components/MountainCard';

import { Colors } from '@/src/constants/colors';
import { useBreakpoints } from '@/src/hooks/useBreakpoints';

const ExploreScreen = ({ 
    trails, 
    onViewMountain 
}) => {

    const { width } = useBreakpoints();
    
    const containerPadding = 16;
    const gap = 16;
    const availableWidth = width - (containerPadding * 2);

    let numColumns = 1;
    if (width >= 1200) numColumns = 4;
    else if (width >= 900) numColumns = 3;
    else if (width >= 600) numColumns = 2;

    const cardWidth = (availableWidth - (gap * (numColumns - 1))) / numColumns;

    const [selectedCategory, setSelectedCategory] = useState('All');
    const categories = ['All', 'Recommended', 'Nearby', 'Discover', 'Challenge'];

    const filteredTrails = useMemo(() => {
        return filterTrailsByCategory(trails, selectedCategory);
    }, [selectedCategory, trails]);

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            <View style={styles.container}>
                
                <CustomHeader 
                    title="Explore"
                    showDefaultIcons={true} 
                />

                <ResponsiveScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <SearchBar 
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onSelectCategory={setSelectedCategory}
                        onFilterPress={() => console.log('Filter Pressed')}
                    />

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
        </ScreenWrapper>
    );
};

const filterTrailsByCategory = (trails, category) => {
    if (!trails) return [];

    switch (category) {
        case 'Recommended':
            return trails.filter(t => (t.score || 0) >= 4.6);
        
        case 'Nearby':
            return trails.filter(t => {
                const address = t.address || "";
                
                const provinceData = t.province;
                const isRizal = Array.isArray(provinceData) 
                    ? provinceData.includes('Rizal') 
                    : (provinceData || "").includes('Rizal');

                return address.includes('Rizal') || isRizal;
            });

        case 'Discover':
            return trails.slice(0, 3); 
        
        case 'Challenge':
            return trails.filter(t => {
                const elev = Number(t.masl || 0);
                const len = Number(t.length || 0);
                return elev > 600 || len > 10;
            });

        case 'All':
        default:
            return trails;
    }
};

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