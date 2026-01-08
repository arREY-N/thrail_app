import CustomButton from "@/src/components/CustomButton";
import CustomTextInput from "@/src/components/CustomTextInput";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

export default function trail(){
    const provinces = ["Cavite", "Laguna", "Rizal", "Batangas", "Quezon"];
    const router = useRouter();
    const [trail, setTrail] = useState(null);
    const [error, setError] = useState(null);
    const [name, setName] = useState(trail?.name);
    const [length, setLength] = useState(trail?.length);
    const [province, setProvince] = useState(trail?.province ?? []);
    const [address, setAddress] = useState(trail?.address);
    const { createTrail, removeTrail } = useTrailsStore();
    const trails = useTrailsStore((state) => state.trails);
    const loadTrails = useTrailsStore((state) => state.loadTrails);

    useEffect(() => {
        loadTrails();
    }, [])
    
    const onCreateTrailPress = (trailData) => {
        try {
            if(!trailData.name || !trailData.length || !trailData.province || !trailData.address){
                throw new Error('Name, Length, Province, and Address are required fields');
            }
            createTrail({...trailData, id:trail?.id});
            setName('');
            setLength();
            setProvince([]);
            setAddress('');
        } catch (err) {
            setError(err.message);
        }
    }

    const onUpdateTrailPress = (id) => {
        try{
            const selTrail = trails.find(t => t.id === id);
            if(!selTrail) throw new Error('Trail not found');
            setTrail(selTrail)
            setName(selTrail.name);
            setLength(selTrail.length);
            setProvince(selTrail.province ?? []);
            setAddress(selTrail.address);
        } catch (err) {
            setError(err.message);
        }
    }

    const onRemovePress = (id) => {
        try {
            console.log('Remove: ', id);
            removeTrail(id);
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <ScrollView>
            <Text>Trails</Text>

            {error && <Text>{error}</Text>}
            <CustomTextInput
                placeholder="Name"
                value={name ?? ''}
                onChangeText={setName}
            />

            <CustomTextInput
                placeholder="Length"
                value={length ?? ''}
                onChangeText={setLength}
            />

            <CustomTextInput
                placeholder="Province"
                value={province ?? ''}
                onChangeText={setProvince}
            />

            {
                provinces.map((key, index) => {
                    return (
                        <Pressable onPress={() => setProvince((p) => [...p, key])}>
                            <Text>{key}</Text>
                        </Pressable>
                    )
                })
            }

            <CustomTextInput
                placeholder="Address"
                value={address ?? ''}
                onChangeText={setAddress}
            />
            
            <CustomButton
                title="Publish" 
                onPress={() => onCreateTrailPress({name, length, province, address})}
                variant="primary" 
            />

            {
                trails.map((t) => {
                    const locs = t.province ?? [];                    
                    return(
                        <ScrollView key={t.id} style={styles.trail}>
                            <Pressable onPress={() => onUpdateTrailPress(t.id)} key={t.id}>
                                <Text>{t.name}</Text>
                                {
                                    locs?.map(l => <Text>{l}</Text>)
                                }
                            </Pressable>
                            <Pressable onPress={() => onRemovePress(t.id)}>
                                <Text>Remove Trail</Text>
                            </Pressable>
                        </ScrollView>
                    )
                })
            }
        </ScrollView>
        // <ExploreScreen/>
    )
}

const styles = StyleSheet.create({
    trail: {
        marginVertical: 5, 
    }
})