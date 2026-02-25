import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomText from '@/src/components/CustomText';

import { Colors } from '@/src/constants/colors';

const OfferCardItem = ({ offer, isSelected, isExpanded, onSelect, onToggleExpand }) => {
    return (
        <TouchableOpacity 
            activeOpacity={0.8}
            style={[
                styles.offerCard, 
                isSelected && styles.selectedOfferCard
            ]}
            onPress={onSelect}
        >
            <View style={styles.cardHeader}>
                <View style={styles.guideAvatar}>
                    <CustomIcon 
                        library="FontAwesome5" 
                        name="user-circle" 
                        size={24} 
                        color={Colors.WHITE} 
                    />
                </View>
                
                <View style={styles.guideInfo}>
                    <CustomText variant="label" style={styles.guideName}>
                        {offer.business?.name || "Independent Guide"}
                    </CustomText>
                    
                    <View style={styles.ratingRow}>
                        <CustomIcon 
                            library="AntDesign" 
                            name="star" 
                            size={12} 
                            color={Colors.YELLOW} 
                        />
                        <CustomText variant="caption">
                            4.9 (60 reviews)
                        </CustomText>
                    </View>
                </View>

                <View style={styles.priceInfo}>
                    <CustomText variant="title" style={styles.priceText}>
                        ₱{offer.price}
                    </CustomText>
                    <CustomText variant="caption" style={styles.perPerson}>
                        / Per Person
                    </CustomText>
                </View>
            </View>

            {isExpanded && (
                <View style={styles.expandedContent}>
                    
                    {offer.description && (
                        <View style={styles.detailBlock}>
                            <CustomText variant="label" style={styles.detailLabel}>
                                About
                            </CustomText>
                            <CustomText variant="caption" style={styles.detailText}>
                                {offer.description}
                            </CustomText>
                        </View>
                    )}

                    {offer.inclusions && offer.inclusions.length > 0 && (
                        <View style={styles.detailBlock}>
                            <CustomText variant="label" style={styles.detailLabel}>
                                Inclusions
                            </CustomText>
                            {offer.inclusions.map((item, idx) => (
                                <View key={idx} style={styles.bulletRow}>
                                    <View style={styles.bulletPoint} />
                                    <CustomText variant="caption" style={styles.bulletText}>
                                        {item}
                                    </CustomText>
                                </View>
                            ))}
                        </View>
                    )}

                    {offer.documents && offer.documents.length > 0 && (
                        <View style={styles.detailBlock}>
                            <CustomText variant="label" style={styles.detailLabel}>
                                Requirements
                            </CustomText>
                            {offer.documents.map((item, idx) => (
                                <View key={idx} style={styles.bulletRow}>
                                    <View style={styles.bulletPoint} />
                                    <CustomText variant="caption" style={styles.bulletText}>
                                        {item}
                                    </CustomText>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}

            <TouchableOpacity 
                style={styles.chevronContainer}
                onPress={onToggleExpand}
                activeOpacity={0.6}
            >
                <CustomIcon 
                    library="Feather" 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={Colors.GRAY_MEDIUM} 
                />
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    offerCard: {
        backgroundColor: Colors.WHITE,
        borderRadius: 16,
        padding: 16,
        paddingBottom: 4, 
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.GRAY_LIGHT,

        shadowColor: Colors.SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,

        elevation: 2,
    },
    selectedOfferCard: {
        borderColor: Colors.PRIMARY,
        borderWidth: 2,
        backgroundColor: Colors.BACKGROUND,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    guideAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    guideInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    guideName: {
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    priceInfo: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    priceText: {
        fontSize: 20,
        color: Colors.PRIMARY,
        marginBottom: 2,
    },
    perPerson: {
        fontSize: 11,
    },
    expandedContent: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.GRAY_ULTRALIGHT,
    },
    detailBlock: {
        marginBottom: 12,
    },
    detailLabel: {
        fontWeight: 'bold',
        color: Colors.TEXT_PRIMARY,
        marginBottom: 4,
    },
    detailText: {
        color: Colors.TEXT_SECONDARY,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        paddingLeft: 8,
    },
    bulletPoint: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.PRIMARY,
        marginRight: 8,
    },
    bulletText: {
        color: Colors.TEXT_SECONDARY,
        flex: 1,
    },
    chevronContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
});

export default OfferCardItem;