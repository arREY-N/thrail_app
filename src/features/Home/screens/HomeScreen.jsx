import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    Platform
} from 'react-native';

import CustomHeader from '@/src/components/CustomHeader';
import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';
import ResponsiveScrollView from '@/src/components/ResponsiveScrollView';
import ScreenWrapper from '@/src/components/ScreenWrapper';

import { Colors } from '@/src/constants/colors';
import { useWeather } from '@/src/hooks/useWeather';
import { useLocation } from '@/src/hooks/useLocation';

import MountainCard from '@/src/components/MountainCard';
import WeatherSection from '@/src/features/Home/components/WeatherSection';

const HomeScreen = ({
    locationTemp, // unused now but left for signature consistency
    onWeatherPress,
    onViewAllRecommendationPress,
    onViewAllTrendingPress,
    onViewAllDiscoverPress,
    recommendedTrails, 
    discoverTrails,
    onMountainPress,
    onDownloadPress,
}) => {
    
    const { latitude, longitude } = useLocation();
    const { weatherData, loading, error } = useWeather(latitude, longitude);

    const recList = recommendedTrails || [];
    const discList = discoverTrails || [];

    const hasAnyTrails = recList.length > 0 || discList.length > 0;

    const ListSection = ({ title, data, onViewAll }) => {
        const hasData = data && data.length > 0;

        return (
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

                {hasData ? (
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
                        <CustomIcon 
                            library="Ionicons" 
                            name="trail-sign-outline" 
                            size={32} 
                            color={Colors.GRAY_MEDIUM} 
                        />
                        
                        <CustomText variant="caption" style={styles.emptyStateText}>
                            No trails available yet.
                        </CustomText>
                    </View>
                )}
            </View>
        );
    };

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
                alwaysBounceVertical={false} 
                overScrollMode={hasAnyTrails ? 'auto' : 'never'} 
                scrollEnabled={hasAnyTrails}
            >
                <WeatherSection 
                    weatherData={weatherData}
                    loading={loading}
                    error={error}
                    onPress={onWeatherPress} 
                />

                <ListSection 
                    title="Recommendations" 
                    data={recList} 
                    onViewAll={onViewAllRecommendationPress} 
                />

                <ListSection 
                    title="Discover" 
                    data={discList}
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
        gap: 16,
    },

    sectionContainer: {
        marginTop: 0,
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