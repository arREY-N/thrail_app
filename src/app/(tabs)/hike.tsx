import useHike from '@/src/core/hook/hike/useHike';
import { Hike } from '@/src/core/models/Hike/Hike';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

export default function hike(){
    const { 
        hikes,
        viewHike
    } = useHike({});

    return (
        // <NavigationScreen/>
        <TestListHike 
            hikes={hikes} 
            viewHike={viewHike}
        />  
    )
}


export type TestListHikeParams = {
    hikes: Hike[];
    viewHike: (id: string) => void;
}

export const TestListHike = (params: TestListHikeParams) => {
    const { 
        hikes,
        viewHike
    } = params;

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
    }
})