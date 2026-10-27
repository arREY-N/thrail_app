import React, { useCallback, useEffect, useRef } from 'react';
import {
    isTutorialMeasurementActive,
    registerMeasureCallback,
    registerTutorialLayout,
    requestTargetMeasurement,
} from '@/src/components/Tutorial/Tutorial';
import { ScrollView, StyleSheet, View } from 'react-native';

import CustomIcon from '@/src/components/CustomIcon';
import CustomInfoRow from '@/src/components/CustomInfoRow';
import CustomText from '@/src/components/CustomText';
import { Colors } from '@/src/constants/colors';
import { GlobalStyles } from '@/src/constants/globalStyles';
import { Layout } from '@/src/constants/layout';

export interface StatusScreenProps {
    selectedMethod?: string | null;
    amountToPay?: number | string;
    bookingId?: string;
    referenceCode?: string;
    activeTutorialStep?: string;
    isTutorialVisible?: boolean;
}

const StatusScreen = ({
    selectedMethod,
    amountToPay = 0,
    bookingId,
    referenceCode,
    activeTutorialStep,
    isTutorialVisible,
}: StatusScreenProps) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const bannerRef = useRef<View>(null);
    const receiptRef = useRef<View>(null);
    const receiptOffsetY = useRef<number>(0);

    const measureBannerNow = useCallback(() => {
        bannerRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('payment_status_banner', { x, y, width, height });
            }
        });
    }, []);

    const measureReceiptNow = useCallback(() => {
        receiptRef.current?.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                registerTutorialLayout('payment_receipt_card', { x, y, width, height });
            }
        });
    }, []);

    useEffect(() => {
        const unsub1 = registerMeasureCallback('payment_status_banner', measureBannerNow);
        const unsub2 = registerMeasureCallback('payment_receipt_card', measureReceiptNow);
        return () => {
            unsub1();
            unsub2();
        };
    }, [measureBannerNow, measureReceiptNow]);

    useEffect(() => {
        if (!isTutorialVisible) return;
        if (activeTutorialStep === 'payment_status_banner' || activeTutorialStep === 'header_help') {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            requestTargetMeasurement(activeTutorialStep);
        } else if (activeTutorialStep === 'payment_receipt_card') {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, receiptOffsetY.current - 24),
                animated: true,
            });
            requestTargetMeasurement('payment_receipt_card');
        }
    }, [isTutorialVisible, activeTutorialStep]);

    return (
        <ScrollView 
            showsVerticalScrollIndicator={false} 
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
        >
            <View style={styles.constrainer}>
                <View
                    ref={bannerRef}
                    collapsable={false}
                    style={styles.headerSection}
                    onLayout={() => {
                        if (isTutorialMeasurementActive()) measureBannerNow();
                    }}
                >
                    <View style={styles.iconCircle}>
                        <CustomIcon library="Feather" name="check" size={40} color={Colors.WHITE} />
                    </View>
                    
                    <CustomText variant="h1" style={styles.title}>
                        Payment Submitted!
                    </CustomText>
                    
                    <CustomText variant="body" style={styles.subtitle}>
                        Your payment receipt has been successfully sent to the 
                        tour provider for verification.
                    </CustomText>
                </View>

                <View
                    ref={receiptRef}
                    collapsable={false}
                    style={styles.summaryCard}
                    onLayout={(e) => {
                        receiptOffsetY.current = e.nativeEvent.layout.y;
                        if (isTutorialMeasurementActive()) measureReceiptNow();
                    }}
                >
                    <CustomText variant="h3" style={styles.summaryTitle}>
                        Transaction Summary
                    </CustomText>
                    
                    <View style={styles.divider} />

                    <CustomInfoRow
                        label="Method"
                        value={selectedMethod || 'N/A'}
                        isLast={true}
                    />
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    constrainer: {
        width: '100%',
        maxWidth: Layout.MAX_WIDTH,
        alignSelf: 'center',
        paddingHorizontal: 16,
        alignItems: 'center'
    },
    scrollContent: { 
        paddingTop: 40, 
        paddingBottom: 120,
        alignItems: 'center'
    },
    headerSection: { 
        alignItems: 'center', 
        marginBottom: 32 
    },
    iconCircle: { 
        width: 80, 
        height: 80, 
        borderRadius: 40, 
        backgroundColor: Colors.SUCCESS, 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginBottom: 20, 

        ...GlobalStyles.dropShadow(3), 
    },
    title: { 
        marginBottom: 12, 
        color: Colors.TEXT_PRIMARY 
    },
    subtitle: { 
        textAlign: 'center', 
        color: Colors.TEXT_SECONDARY, 
        paddingHorizontal: 20, 
        lineHeight: 22 
    },
    summaryCard: { 
        backgroundColor: Colors.WHITE, 
        width: '100%', 
        borderRadius: 20, 
        padding: 20, 
        borderWidth: 1, 
        borderColor: Colors.GRAY_LIGHT, 
         
         
         
         
        ...GlobalStyles.dropShadow(3), 
    },
    summaryTitle: { 
        marginBottom: 16, 
        fontWeight: '700', 
        color: Colors.TEXT_PRIMARY 
    },
    divider: { 
        height: 1, 
        backgroundColor: Colors.GRAY_LIGHT, 
        marginBottom: 16 
    },
    detailRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
    },
    dataColumn: { 
        flexDirection: 'column', 
        alignItems: 'flex-start', 
        marginBottom: 16 
    },
    detailLabel: { 
        color: Colors.TEXT_SECONDARY, 
        marginBottom: 4 
    },
    detailValue: { 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: '600', 
        flex: 1, 
        textAlign: 'right', 
        marginLeft: 20 
    },
    longValue: { 
        color: Colors.TEXT_PRIMARY, 
        fontWeight: '600', 
        textAlign: 'left' 
    },
    totalValue: { 
        color: Colors.PRIMARY 
    },
    noMarginBottom: {
        marginBottom: 0
    }
});

export default StatusScreen;
