import CustomButton from "@/src/components/CustomButton";
import CustomTextInput from "@/src/components/CustomTextInput";
import ResponsiveScrollView from "@/src/components/ResponsiveScrollView";
import { validateOffer } from "@/src/core/domain/offerDomain";
import { useBusinessesStore } from "@/src/core/stores/businessesStore";
import { useOffersStore } from "@/src/core/stores/offersStore";
import { useTrailsStore } from "@/src/core/stores/trailsStore";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

export default function createOffer() {
    const TEST_BUSINESS_ID = 'Business_A';
    const TEST_BUSINESS_NAME = 'Business A';
    const TEST_OFFER_DATE = Date.now();
    
    const { trails } = useTrailsStore();
    const { addOffer } = useOffersStore();
    const { businesses, loadBusinesses } = useBusinessesStore();

    const [error, setError] = useState(null);
    const [price, setPrice] = useState(null);
    const [trail, setTrail] = useState(null);
    const [business, setBusiness] = useState(null);

    useEffect(() => {
        loadBusinesses()
    }, []);

    const onSelectTrail = (id) => {
        setTrail(() => {
            const selected = trails.find(i => i.id === id);
            
            if (!selected) {
                console.error('Trail not found');
                return null;
            }

            return selected;
        });
    }

    const onSelectBusiness = (id) => {
        setBusiness(() => {
            const selected = businesses.find(i => i.id === id);

            if(!selected) {
                console.error('Business not found');
                return null;
            }

            return selected;
        })
    }

    const onPublishPress = async (businessId, trailId, price, date, inclusion = []) => {
        try {
            validateOffer(businessId, trailId, price, date);

            const trailData = trails.find(i => i.id === trailId);
            const businessData = businesses.find(i => i.id === businessId);
    
            if(!trailData) throw new Error('Trail not found', trailId);
            if(!businessData) throw new Error('Business not found', businessId)
                
            const businessName = businessData?.name ?? TEST_BUSINESS_NAME;
            const trailName = trailData?.name ?? 'TRAIL';
    
            await addOffer({
                businessId,
                businessName,
                trailId,
                trailName,
                price,
                date,
                inclusion
            });
    
            setTrail(null);
            setPrice(null);
            setBusiness(null);
            setError(null);
        } catch (err) {
            setError(err);
        }
        
    }

    return(
        <ResponsiveScrollView>
            <Text>Create offer</Text>
            
            { error && <Text>{error.message}</Text>}

            <CustomTextInput
                placeholder="Businesses"
                value={business?.name ?? ''}
                onChangeText={setBusiness}
                keyboardType="phone-pad"
            />

            {
                businesses.map((b) => {
                    return (
                        <Pressable key={b.id} style={styles.trail} onPress={() => onSelectBusiness(b.id)}>
                            <Text>{b.name}</Text>
                        </Pressable>
                    )
                })
            }
            
            <CustomTextInput
                placeholder="Trail"
                value={trail?.name ?? ''}
                onChangeText={setTrail}
                keyboardType="phone-pad"
            />

            {
                trails.map((t) => {
                    return (
                        <Pressable key={t.id} style={styles.trail} onPress={() => onSelectTrail(t.id)}>
                            <Text>{t.name}</Text>
                        </Pressable>
                    )
                })
            }

            <CustomTextInput
                placeholder="Price"
                value={price ?? ''}
                onChangeText={setPrice}
                keyboardType="phone-pad"
            />
            
            <CustomButton 
                title="Publish" 
                onPress={() => onPublishPress(business?.id, trail?.id, price, TEST_OFFER_DATE)}
                variant="primary" 
            />
        </ResponsiveScrollView>
    )
}

const styles = StyleSheet.create({
    trail: {
        marginVertical: 1,
        border: 1
    }
})