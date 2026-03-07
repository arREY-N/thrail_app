import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const WeatherSection = ({ locationTemp, onPress }) => {

    const getWeatherIcon = (temp) => {
        if (!temp) return 'partly-sunny-outline';
        
        if (temp >= 30) {
            return 'sunny';
        } else if (temp >= 24) {
            return 'partly-sunny';
        } else {
            return 'cloudy';
        }
    };

    const iconName = getWeatherIcon(locationTemp?.temperature);

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
            <View style={styles.row}>
                <View style={styles.leftColumn}>
                    <CustomText variant="title" style={styles.tempText}>
                        {locationTemp?.temperature ? `${locationTemp.temperature}°C` : '--'}
                    </CustomText>
                    
                    <View style={styles.locationRow}>
                        <CustomIcon 
                            library="FontAwesome6" 
                            name="location-dot" 
                            size={12}
                            color={Colors.TEXT_SECONDARY} 
                        />
                        
                        <CustomText variant="caption" style={styles.locationText}>
                            {locationTemp?.location || 'Locating...'}
                        </CustomText>
                    </View>
                </View>

                <View style={styles.rightColumn}>
                    <CustomIcon 
                        library="Ionicons" 
                        name={iconName}
                        size={40} 
                        color={Colors.TEXT_SECONDARY} 
                    />
                    
                    <CustomText variant="caption" style={styles.dayNightText}>
                        Day {locationTemp?.day || '--'}° / Night {locationTemp?.night || '--'}°
                    </CustomText>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16, 
        marginTop: 8,
        marginBottom: 12,     
        paddingHorizontal: 20, 
        paddingVertical: 16,
        backgroundColor: Colors.WHITE,
        borderRadius: 12,     
        
        elevation: 3,
        shadowColor: Colors.SHADOW, 
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    
    leftColumn: {
        justifyContent: 'center',
        gap: 2,
    },
    tempText: {
        fontSize: 36,
        fontWeight: '800',
        color: Colors.TEXT_PRIMARY,
        lineHeight: 40, 
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    locationText: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.TEXT_SECONDARY,
    },

    rightColumn: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 4,
    },
    dayNightText: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.TEXT_SECONDARY,
    },
});

export default WeatherSection;

// import React from 'react';
// import {
//     StyleSheet,
//     TouchableOpacity,
//     View
// } from 'react-native';

// import CustomIcon from '@/src/components/CustomIcon';
// import CustomText from '@/src/components/CustomText';

// import { Colors } from '@/src/constants/colors';

// const WeatherSection = ({ locationTemp, onPress }) => {

//     const getWeatherIcon = (temp) => {
//         if (!temp) return 'partly-sunny-outline';
        
//         if (temp >= 30) {
//             return 'sunny';
//         } else if (temp >= 24) {
//             return 'partly-sunny';
//         } else {
//             return 'cloudy';
//         }
//     };

//     const iconName = getWeatherIcon(locationTemp?.temperature);

//     return (
//         <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
//             <View style={styles.row}>
//                 <View style={styles.leftColumn}>
//                     <CustomText variant="title" style={styles.tempText}>
//                         {locationTemp?.temperature ? `${locationTemp.temperature}°c` : '--'}
//                     </CustomText>
                    
//                     <View style={styles.locationRow}>
//                         <CustomIcon 
//                             library="FontAwesome6" 
//                             name="location-dot" 
//                             size={14}
//                             color={Colors.TEXT_SECONDARY} 
//                         />
                        
//                         <CustomText variant="caption" style={styles.locationText}>
//                             {locationTemp?.location || 'Locating...'}
//                         </CustomText>
//                     </View>
//                 </View>

//                 <View style={styles.rightColumn}>
//                     <CustomIcon 
//                         library="Ionicons" 
//                         name={iconName}
//                         size={52} 
//                         color={Colors.TEXT_SECONDARY} 
//                     />
                    
//                     <CustomText variant="caption" style={styles.dayNightText}>
//                         Day {locationTemp?.day || '--'}° / Night {locationTemp?.night || '--'}°
//                     </CustomText>
//                 </View>
//             </View>
//         </TouchableOpacity>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         paddingHorizontal: 20, 
//         paddingTop: 16,
//         paddingBottom: 16,
//         backgroundColor: Colors.WHITE,
//         elevation: 4,

//         shadowColor: Colors.SHADOW, 
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         borderBottomWidth: 1,
//         borderBottomColor: Colors.GRAY_LIGHT,
//     },
//     row: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'stretch',
//     },
    
//     leftColumn: {
//         justifyContent: 'flex-start',
//     },
//     tempText: {
//         fontSize: 64, 
//         fontWeight: 'bold',
//         color: Colors.TEXT_PRIMARY,
//         lineHeight: 70, 
//         includeFontPadding: false, 
//     },
//     locationRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 6,
//         marginTop: 4,
//         paddingLeft: 4, 
//     },
//     locationText: {
//         fontSize: 14,
//         fontWeight: '500',
//         color: Colors.TEXT_SECONDARY,
//     },

//     rightColumn: {
//         alignItems: 'flex-end',
//         justifyContent: 'space-between',
//     },
//     dayNightText: {
//         fontSize: 12,
//         fontWeight: '500',
//         color: Colors.TEXT_SECONDARY,
//         marginBottom: 2,
//     },
// });

// export default WeatherSection;