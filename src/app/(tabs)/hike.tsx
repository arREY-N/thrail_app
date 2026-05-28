import useHike from '@/src/core/hook/hike/useHike';
import { Hike } from '@/src/core/models/Hike/Hike';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import NavigationScreen from "@/src/features/Navigation/screens/NavigationScreen";
import { useIsFocused } from '@react-navigation/native';

import CustomFAB from '@/src/components/CustomFAB';
import CustomHeader from '@/src/components/CustomHeader';
import ScreenWrapper from '@/src/components/ScreenWrapper';
import { Colors } from '@/src/constants/colors';
import { useAppNavigation } from '@/src/core/hook/navigation/useAppNavigation';

export default function hike(){
    const isFocused = useIsFocused();
    const { 
        hikes,
        viewHike,
        isLoading,
        error
    } = useHike({});

    const {
        onGroupPress
    } = useAppNavigation();

    return (
        <ScreenWrapper backgroundColor={Colors.BACKGROUND} style={{}}>
            
            <CustomHeader 
                title="Hike"
                showDefaultIcons={true} 
                onBackPress={undefined}
                rightActions={null}
                style={{}}
            >
                {null} 
            </CustomHeader>

            <View style={{ flex: 1 }}>
                { isFocused && <NavigationScreen/> }
                <TestListHike 
                    hikes={hikes} 
                    viewHike={viewHike}
                    isLoading={isLoading}
                    error={error}
                />  
            </View>

            <CustomFAB 
                onPress={onGroupPress} 
                style={undefined} 
            />

        </ScreenWrapper>
    )
}


export type TestListHikeParams = {
    hikes: Hike[];
    viewHike: (id: string) => void;
    isLoading?: boolean;
    error?: string | null;
}

export const TestListHike = (params: TestListHikeParams) => {
    const { 
        hikes,
        viewHike,
        isLoading,
        error
    } = params;

    if (isLoading) {
        return (
            <View style={styles.center}>
                <Text>Loading hikes...</Text>
            </View>
        )
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={{color: 'red'}}>Error: {error}</Text>
            </View>
        )
    }

    if (!hikes || hikes.length === 0) {
        return (
            <View style={styles.center}>
                <Text>No hikes found. Start a new adventure!</Text>
            </View>
        )
    }

    return(
        <ScrollView>
            {
                hikes.map(h => (
                    <Pressable key={h.id} style={styles.review} onPress={() => viewHike(h.id)}>
                        <Text>{ h.name }</Text>
                        <Text>{ h.predictedDifficulty }</Text>
                        { h.completed 
                            ? <Text>Completed</Text> 
                            : <Text>Not Completed</Text> 
                        }
                        <Text>{ h.mode }</Text>
                        { h.mode === 'booked' && 
                            <Text>Booking ID: { h.bookingId }</Text>
                        }
                    </Pressable>
                ))
            }
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    review: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        margin: 10
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    }
})