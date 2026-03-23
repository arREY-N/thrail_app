import LoadingScreen from "@/src/app/loading";
import { useAppNavigation } from "@/src/core/hook/navigation/useAppNavigation";
import { useOfferWrite } from "@/src/core/hook/offer/useOfferWrite";
import useTrail from "@/src/core/hook/trail/useTrail";
import { useAuthHook } from "@/src/core/hook/user/useAuthHook";
import getSearchParam from "@/src/core/utility/getSearchParam";
import OfferWriteScreen from "@/src/features/Admin/screens/OfferWriteScreen";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";

export default function writeOffer() {
    const { offerId: rawOfferId } = useLocalSearchParams();
    const { businessId } = useAuthHook();
    const { onBackPress } = useAppNavigation();

    const offerId = getSearchParam(rawOfferId);

    const { trails } = useTrail();

    const {
        offer,
        error,
        isLoading,
        onRemovePress,
        onUpdatePress,
        onSubmitPress,
    } = useOfferWrite({ offerId, businessId });
    
    if (isLoading || !offer) return <LoadingScreen />;
    
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <OfferWriteScreen
                offer={offer}
                trails={trails}
                isLoading={isLoading}
                error={error}
                onSubmitOffer={onSubmitPress}
                onDeleteOffer={onRemovePress}
                onUpdateOffer={onUpdatePress}
                onBackPress={onBackPress}
            />
        </>
        
    );
}

// export type TestWriteOfferParams = {
//     offer: Offer;
//     error: string | null;
//     isLoading: boolean;
//     trails: Trail[];
//     onSubmitOffer: () => Promise<void>;
//     onDeleteOffer: (id: string) => Promise<void>;
//     onUpdateOffer: (params: TEdit<Offer>) => void;
//     onSetTrail: (trail: Trail) => void;
//     onBackPress: () => void;
// };

// const TESTWRITEOFFER = ({
//     trails,
//     offer,
//     error,
//     isLoading,
//     onSubmitOffer,
//     onDeleteOffer,
//     onUpdateOffer,
//     onSetTrail,
//     onBackPress,
// }: TestWriteOfferParams) => {
//     return (
//         <ScreenWrapper backgroundColor={Colors.BACKGROUND} style={undefined}>
//             <ScrollView contentContainerStyle={styles.scrollContent}>
//                 <View style={styles.formCard}>
                    
//                     <CustomTextInput 
//                         label="Description *"
//                         placeholder="Offer description"
//                         value={offer.description}
//                         onChangeText={(text: string) => onUpdateOffer({
//                             section: 'root',
//                             id: 'description',
//                             value: text
//                         })}
//                         style={styles.inputSpacing} secureTextEntry={undefined} keyboardType={undefined} isPasswordVisible={undefined} onTogglePassword={undefined} icon={undefined} prefix={undefined} children={undefined} showTodayButton={undefined} allowFutureDates={undefined}                    />

//                     <CustomTextInput 
//                         label="Price (PHP) *"
//                         placeholder="0"
//                         value={offer.price ? String(offer.price) : ''}
//                         keyboardType="numeric"
//                         onChangeText={(text: string) => onUpdateOffer({
//                             section: 'root',
//                             id: 'price',
//                             value: Number(text) || 0
//                         })}
//                         style={styles.inputSpacing} secureTextEntry={undefined} isPasswordVisible={undefined} onTogglePassword={undefined} icon={undefined} prefix={undefined} children={undefined} showTodayButton={undefined} allowFutureDates={undefined}                    />

//                     <CustomTextInput 
//                         type="calendar"
//                         label="Hike Date *"
//                         placeholder="Select Date"
//                         value={offer.date || null}
//                         allowFutureDates={true}
//                         onChangeText={(val: Date) => onUpdateOffer({
//                             section: 'root',
//                             id: 'date',
//                             value: val
//                         })}
//                         style={styles.inputSpacing} secureTextEntry={undefined} keyboardType={undefined} isPasswordVisible={undefined} onTogglePassword={undefined} icon={undefined} prefix={undefined} children={undefined} showTodayButton={undefined}                    />

//                     <View style={styles.row}>
//                         <View style={styles.flexHalf}>
//                             <CustomTextInput 
//                                 label="Min Pax *"
//                                 placeholder="0"
//                                 value={offer.minPax ? String(offer.minPax) : ''}
//                                 keyboardType="numeric"
//                                 onChangeText={(text: string) => onUpdateOffer({
//                                     section: 'root',
//                                     id: 'minPax',
//                                     value: Number(text) || 0
//                                 })}
//                                 style={styles.inputSpacing} secureTextEntry={undefined} isPasswordVisible={undefined} onTogglePassword={undefined} icon={undefined} prefix={undefined} children={undefined} showTodayButton={undefined} allowFutureDates={undefined}                            />
//                         </View>
//                         <View style={styles.flexHalf}>
//                             <CustomTextInput 
//                                 label="Max Pax *"
//                                 placeholder="0"
//                                 value={offer.maxPax ? String(offer.maxPax) : ''}
//                                 keyboardType="numeric"
//                                 onChangeText={(text: string) => onUpdateOffer({
//                                     section: 'root',
//                                     id: 'maxPax',
//                                     value: Number(text) || 0
//                                 })}
//                                 style={styles.inputSpacing} secureTextEntry={undefined} isPasswordVisible={undefined} onTogglePassword={undefined} icon={undefined} prefix={undefined} children={undefined} showTodayButton={undefined} allowFutureDates={undefined}                            />
//                         </View>
//                     </View>

//                     <CustomTextInput 
//                         label="Required Documents"
//                         placeholder="Valid ID, Medical Certificate (comma-separated)"
//                         value={offer.documents && offer.documents.length > 0 ? offer.documents.join(', ') : ''}
//                         onChangeText={(text: string) => onUpdateOffer({
//                             section: 'root',
//                             id: 'documents',
//                             value: text.split(',').map(s => s.trim()).filter(Boolean)
//                         })}
//                         style={styles.inputSpacing} secureTextEntry={undefined} keyboardType={undefined} isPasswordVisible={undefined} onTogglePassword={undefined} icon={undefined} prefix={undefined} children={undefined} showTodayButton={undefined} allowFutureDates={undefined}                    />

//                     <CustomTextInput 
//                         label="Inclusions"
//                         placeholder="Guide Fee, Transpo (comma-separated)"
//                         value={offer.inclusions && offer.inclusions.length > 0 ? offer.inclusions.join(', ') : ''}
//                         onChangeText={(text: string) => onUpdateOffer({
//                             section: 'root',
//                             id: 'inclusions',
//                             value: text.split(',').map(s => s.trim()).filter(Boolean)
//                         })}
//                         style={styles.inputSpacing} secureTextEntry={undefined} keyboardType={undefined} isPasswordVisible={undefined} onTogglePassword={undefined} icon={undefined} prefix={undefined} children={undefined} showTodayButton={undefined} allowFutureDates={undefined}                    />

//                     <CustomText variant="label" style={styles.multiSelectLabel} color={undefined}>
//                         Select Trail *
//                     </CustomText>
                    
//                     <View style={styles.locationsContainer}>
//                         {trails.map(trail => (
//                             <SelectionOption
//                                 key={trail.id}
//                                 label={trail.general.name}
//                                 selected={offer.trail?.id === trail.id}
//                                 onPress={() => {
//                                     onUpdateOffer({
//                                         section: 'root',
//                                         id: 'trail',
//                                         value: {
//                                             id: trail.id,
//                                             name: trail.general.name
//                                         }
//                                     });
//                                 } } style={undefined} children={undefined}                            />
//                         ))}
//                     </View>

//                     {error && <ErrorMessage error={error} style={undefined} children={undefined} />}

//                     <View style={styles.buttonContainer}>
//                         <CustomButton 
//                             title={isLoading ? "Saving..." : "Save Offer"}
//                             onPress={() => onSubmitOffer()}
//                             variant="primary"
//                             disabled={isLoading}
//                             style={styles.actionBtn}
//                         />
                        
//                         {offer.id !== '' && (
//                             <CustomButton 
//                                 title="Delete Offer"
//                                 onPress={() => onDeleteOffer(offer.id)}
//                                 variant="outline"
//                                 disabled={isLoading}
//                                 style={styles.actionBtn}
//                             />
//                         )}
//                     </View>

//                 </View>
//             </ScrollView>
//         </ScreenWrapper>
//     )
// }

// const styles = StyleSheet.create({
//     scrollContent: {
//         paddingVertical: 24,
//         paddingHorizontal: 16,
//     },
//     formCard: {
//         backgroundColor: Colors.WHITE,
//         borderRadius: 24,
//         paddingVertical: 24,
//         paddingHorizontal: 16,
//         shadowColor: Colors.SHADOW,
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.05,
//         shadowRadius: 8,
//         elevation: 2,
//         borderWidth: 1,
//         borderColor: Colors.GRAY_ULTRALIGHT,
//     },
//     inputSpacing: {
//         marginBottom: 16,
//     },
//     row: {
//         flexDirection: 'row',
//         gap: 16,
//     },
//     flexHalf: {
//         flex: 1,
//     },
//     multiSelectLabel: {
//         marginBottom: 8,
//         marginLeft: 2,
//     },
//     locationsContainer: {
//         marginTop: 4,
//         marginBottom: 16,
//     },
//     buttonContainer: {
//         marginTop: 16,
//         gap: 12,
//     },
//     actionBtn: {
//         width: '100%',
//     },
// });