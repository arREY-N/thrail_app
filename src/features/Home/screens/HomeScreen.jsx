import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomHeader from '../../../components/CustomHeader';
import CustomText from '../../../components/CustomText';
import ResponsiveScrollView from '../../../components/ResponsiveScrollView';
import ScreenWrapper from '../../../components/ScreenWrapper';

import { Colors } from '../../../constants/colors';

import MountainCard from '../components/MountainCard';
import WeatherSection from '../components/WeatherSection';

const HomeScreen = ({
    locationTemp, 
    onWeatherPress,
    onViewAllRecommendationPress,
    onViewAllTrendingPress,
    recommendedTrails, 
    onMountainPress,
    onDownloadPress,
}) => {
    
    const displayTrails = recommendedTrails || [];

    const ListSection = ({ title, data, onViewAll }) => (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>

                <CustomText variant="subtitle" style={styles.sectionTitle}>
                    {title}
                </CustomText>

                <TouchableOpacity onPress={onViewAll}>
                    <CustomText variant="caption" style={styles.viewAllText}>
                        View All
                    </CustomText>
                </TouchableOpacity>
            </View>

            {data && data.length > 0 ? (
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList} 
                >
                    {data.map((item) => (
                        <MountainCard 
                            key={`${title}-${item.id}`}
                            item={item}
                            onPress={() => onMountainPress(item.id)}
                            onDownload={() => onDownloadPress(item.id)}
                        />
                    ))}
                </ScrollView>
            ) : (
                <View style={styles.emptyStateContainer}>
                    <Ionicons name="trail-sign-outline" size={32} color={Colors.GRAY_MEDIUM} />
                    <CustomText variant="caption" style={styles.emptyStateText}>
                        No trails available yet.
                    </CustomText>
                </View>
            )}
        </View>
    );

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND}>
            
            <CustomHeader 
                title="Home"
                showDefaultIcons={true} 
            />

            <ResponsiveScrollView 
                style={styles.container} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <WeatherSection 
                    locationTemp={locationTemp} 
                    onPress={onWeatherPress} 
                />

                <ListSection 
                    title="Recommendations" 
                    data={displayTrails} 
                    onViewAll={onViewAllRecommendationPress} 
                />

                <ListSection 
                    title="Trending" 
                    data={displayTrails}
                    onViewAll={onViewAllTrendingPress} 
                />

            </ResponsiveScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: Colors.BACKGROUND,
    },
    scrollContent: {
        paddingBottom: 32,
    },

    sectionContainer: {
        marginTop: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    viewAllText: {
        textDecorationLine: 'underline',
    },
    horizontalList: {
        paddingHorizontal: 16, 
        gap: 16, 
    },
    emptyStateContainer: {
        width: '100%',
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.BACKGROUND, 
        opacity: 0.8,
        gap: 8,
    },
    emptyStateText: {
        color: Colors.TEXT_PLACEHOLDER,
        fontStyle: 'italic',
    }
});

export default HomeScreen;