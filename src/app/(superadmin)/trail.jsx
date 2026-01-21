import CustomButton from "@/src/components/CustomButton";
import CustomTextInput from "@/src/components/CustomTextInput";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function trail(){
    const provinces = ["Cavite", "Laguna", "Rizal", "Batangas", "Quezon"];
    const router = useRouter();
    const system = useTrailsStore(s => s.error);
    const [editing, setEditing] = useState(false);

    const onRemovePress = useTrailsStore(s => s.removeTrail);
    const onCreateTrailPress = useTrailsStore(s => s.createTrail);
    const onEditTrailPress = useTrailsStore(s => s.editTrail);
    const selectTrail = useTrailsStore(s => s.selectTrail);
    const trails = useTrailsStore(s => s.trails);
    const loadTrails = useTrailsStore(s => s.loadTrails);
    const trail = useTrailsStore(s => s.trail);
    
    useEffect(() => {
        loadTrails();
    }, [])

    const onSetProvince = (key) => {
        const province = trail.province.find(p => p === key)
            ? trail.province.filter(p => p !== key)    
            : [...trail.province, key];
        onEditTrailPress({province})
    }

    const onUpdateTrailPress = (id) => {
        selectTrail(id);
        setEditing(true);
    }

    const onCancelEditPress = () => {
        selectTrail();
        setEditing(false);
    }
    
    return (
        <TESTCREATETRAIL 
            onCreateTrailPress={onCreateTrailPress}
            onEditTrailPress={onEditTrailPress}
            onUpdateTrailPress={onUpdateTrailPress}
            onSetProvince={onSetProvince}
            onRemovePress={onRemovePress}
            onCancelEditPress={onCancelEditPress}
            trail={trail}
            trails={trails}
            provinces={provinces}
            system={system}
            editing={editing}
        />
    )
}

const TESTCREATETRAIL = ({
    onCreateTrailPress,
    onEditTrailPress,
    onUpdateTrailPress,
    onSetProvince,
    onRemovePress,
    onCancelEditPress,
    trail,
    trails,
    provinces,
    system,
    editing
}) => {
    return(
        <ScrollView>
            <Text>Trails</Text>

            {system && <Text>{system}</Text>}
            <CustomTextInput
                placeholder="Name"
                value={trail.name ?? ''}
                onChangeText={(name) => onEditTrailPress({name})}
            />

            <CustomTextInput
                placeholder="Length"
                value={trail.length ?? ''}
                onChangeText={(length) => onEditTrailPress({length})}
            />

            <CustomTextInput
                placeholder="Province"
                value={trail.province.join(', ') ?? ''}
                onChangeText={null}
            />

            {
                provinces.map((key, index) => {
                    return (
                        <Pressable key={index} onPress={() => onSetProvince(key)}>
                            <Text>{key}</Text>
                        </Pressable>
                    )
                })
            }

            <CustomTextInput
                placeholder="Address"
                value={trail.address ?? ''}
                onChangeText={(address) => onEditTrailPress({address})}
            />
            
            <CustomButton
                title="Publish" 
                onPress={() => onCreateTrailPress()}
                variant="primary" 
            />

            { editing && 
                <CustomButton
                    title="Cancel" 
                    onPress={() => onCancelEditPress()}
                    variant="primary" 
                />
            }

            {
                trails.map((t) => {
                    const locs = t.province ?? [];                    
                    return(
                        <ScrollView key={t.id} style={styles.trail}>
                            <Text>{t.name}</Text>
                            {
                                locs?.map(l => <Text>{l}</Text>)
                            }
                            <Pressable onPress={() => onUpdateTrailPress(t.id)} key={t.id}>
                                <Text>Edit Trail</Text>
                            </Pressable>
                            <Pressable onPress={() => onRemovePress(t.id)}>
                                <Text>Remove Trail</Text>
                            </Pressable>
                        </ScrollView>
                    )
                })
            }

            <View style={{margin: 50}}/>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    trail: {
        marginVertical: 5, 
    }
})