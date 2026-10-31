import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { memo, useEffect, useRef, useState } from "react";
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import CustomText from "@/src/components/CustomText";
import { Colors, Palette } from "@/src/constants/colors";
import { GlobalStyles } from "@/src/constants/globalStyles";

export interface NetworkStatusBannerProps {
    isOnline: boolean;
    top?: number;
    bottom?: number;
    style?: StyleProp<ViewStyle>;
}

const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({
    isOnline,
    top,
    bottom,
    style,
}) => {
    const wasOfflineRef = useRef<boolean>(!isOnline);
    const [showOnlineToast, setShowOnlineToast] = useState<boolean>(false);
    const [fadeAnim] = useState(() => new Animated.Value(!isOnline ? 1 : 0));
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isOnline) {
            wasOfflineRef.current = true;
            fadeAnim.setValue(1);
            return;
        }

        if (wasOfflineRef.current) {
            wasOfflineRef.current = false;
            fadeAnim.setValue(1);

            const showTimer = setTimeout(() => {
                setShowOnlineToast(true);
            }, 0);

            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            timerRef.current = setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 350,
                    useNativeDriver: true,
                }).start(() => {
                    setShowOnlineToast(false);
                });
            }, 3500);

            return () => {
                clearTimeout(showTimer);
                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                    timerRef.current = null;
                }
            };
        }
    }, [isOnline, fadeAnim]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, []);

    const isOfflineState = !isOnline;
    const isVisible = isOfflineState || showOnlineToast;
    if (!isVisible) {
        return null;
    }

    return (
        <Animated.View
            style={[
                styles.container,
                top !== undefined && { top },
                bottom !== undefined && { bottom },
                { opacity: fadeAnim },
                style,
            ]}
            pointerEvents="none"
        >
            <View
                style={[
                    styles.pill,
                    isOfflineState ? styles.offlinePill : styles.onlinePill,
                ]}
            >
                <MaterialIcons
                    name={isOfflineState ? "wifi-off" : "wifi"}
                    size={14}
                    color={Colors.PRIMARY}
                />
                <CustomText
                    style={[
                        styles.bannerText,
                        isOfflineState ? styles.offlineText : styles.onlineText,
                    ]}
                >
                    {isOfflineState
                        ? "Offline Mode • Using Downloaded Map"
                        : "Back Online"}
                </CustomText>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 90,
    },
    pill: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
        borderWidth: 1,
        ...GlobalStyles.dropShadow(4, 0.15, Colors.SHADOW, { radius: 8 }),
    },
    offlinePill: {
        backgroundColor: Palette.Green50,
        borderColor: Palette.Green200,
    },
    onlinePill: {
        backgroundColor: Palette.Green50,
        borderColor: Palette.Green200,
    },
    bannerText: {
        fontSize: 12,
        fontWeight: "700",
    },
    offlineText: {
        color: Palette.Green900,
    },
    onlineText: {
        color: Palette.Green900,
    },
});

export default memo(NetworkStatusBanner);
