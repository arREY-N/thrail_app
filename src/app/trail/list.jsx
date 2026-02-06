import CustomTextInput from "@/src/components/CustomTextInput";
import { useAuthStore } from "@/src/core/stores/authStore";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function trailList(){
    const router = useRouter();
    const role = useAuthStore(s => s.role);
    const trails = useTrailsStore(s => s.trails);
    const loadTrails = useTrailsStore(s => s.loadAllTrails);
    const isLoading = useTrailsStore(s => s.isLoading);
    const [searchKey, setSearchKey] = useState('');
    const [filteredTrails, setFilteredTrails] = useState([]);

    useEffect(() => {
        loadTrails();
        setFilteredTrails(trails)
    }, [trails])

    const onUpdateTrail = (id) => {
        router.push({
            pathname: '/trail/write',
            params: { trailId: id }
        });
    }
    
    const onCreateNew = () => {
        router.push('/trail/write');
    }

    const onSearchPress = () => {
        if(searchKey){
            setFilteredTrails(() => trails.filter(t => t.name.toUpperCase().includes(searchKey.toUpperCase())))
        } else {
            setFilteredTrails(trails);
        }
    }

    return (
        <TESTCREATETRAIL 
            onUpdateTrail={onUpdateTrail}
            trails={filteredTrails}
            isLoading={isLoading}
            onCreateNew={onCreateNew}
            role={role}
            searchKey={searchKey}
            setSearchKey={setSearchKey}
            onSearchPress={onSearchPress}
        />
    )
}

const TESTCREATETRAIL = ({
    onUpdateTrail,
    trails,
    isLoading,
    onCreateNew,
    role,
    searchKey,
    setSearchKey,
    onSearchPress,
}) => {
    return(
        <ScrollView>
            <CustomTextInput
                label={'Search'}
                placeholder={'trail name'}
                value={searchKey || ''}
                onChangeText={(search) => setSearchKey(search)}
            />
            <Pressable onPress={onSearchPress}>
                <Text>Search</Text>
            </Pressable>
            { role === 'superadmin' &&
                <Pressable onPress={onCreateNew}>
                    <Text>ADD NEW</Text>
                </Pressable>
            }

            { !isLoading 
                ? trails.map((t) => {
                    console.log(t);                   
                    return(
                        <ScrollView key={t.id} style={styles.trailForm}>
                            <Text>Trail Name: {t.name}</Text>
                            { role === 'superadmin' && 
                                <Pressable onPress={() => onUpdateTrail(t.id)}>
                                    <Text>Edit Trail</Text>
                                </Pressable>
                            }
                        </ScrollView>
                    )
                })
                : <Text>Loading Trails</Text>
            }

            <View style={{margin: 50}}/>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    trailForm: {
        margin: 10,
        borderWidth: 1,
        padding: 10
    },
})

