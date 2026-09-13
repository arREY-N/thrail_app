import LoadingScreen from "@/src/app/loading";
import { usePaymentsStore } from "@/src/core/stores/paymentsStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";

export default function Receipt() {
    const { paymentId } = useLocalSearchParams();
    const router = useRouter();

    const loadPayment = usePaymentsStore((s) => s.load);
    const payment = usePaymentsStore((s) => s.current);
    useEffect(() => {
        loadPayment(paymentId);
    }, [loadPayment, paymentId])

    const onHomePress = () => {
        router.replace('/(tabs)' as any)
    }

    if (!payment) return <LoadingScreen />

    return (
        <TESTRECEIPT
            payment={payment}
            onHomePress={onHomePress}
        />
    )

}

const TESTRECEIPT = ({
    payment,
    onHomePress
}: {
    payment: Record<string, any>;
    onHomePress: () => void;
}) => {
    const { receipt, offer, user, business } = payment;

    return (
        <View>
            {payment &&
                <View>
                    <Text>PAYMENT RECEIPT</Text>
                    <Text>Reference No: {receipt.referenceCode || payment.id}</Text>
                    <Text>Amount: P{receipt.amount}.00</Text>
                    <Text>Date: {receipt.date?.toString()}</Text>
                    <Text>By: {user.name}</Text>
                    <Text>Provider: {business.name}</Text>
                    <Text>Trail: {offer.trail}</Text>
                </View>
            }
            <Pressable onPress={onHomePress}>
                <Text>BACK TO HOME</Text>
            </Pressable>
        </View>
    )
}