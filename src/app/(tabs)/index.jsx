
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';

import HomeScreen from '@/src/features/Home/screens/HomeScreen';

export default function home(){
    const { 
        onMountainPress, 
        onDownloadPress, 
        onWeatherPress, 
        onViewAllRecommendationPress, 
        onViewAllTrendingPress 
    } = useAppNavigation();
    
    return (
        <HomeScreen 
            locationTemp={{}} 
            onWeatherPress={onWeatherPress}
            onViewAllRecommendationPress={onViewAllRecommendationPress}
            onViewAllTrendingPress={onViewAllTrendingPress}
            recommendedTrails={[]}
            discoverTrails={[]}
            onMountainPress={onMountainPress}
            onDownloadPress={onDownloadPress}
        />
    );
}