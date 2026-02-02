import { usePaymentsStore } from "@/src/core/stores/paymentsStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import LoadingScreen from "../loading";

export default function receipt(){
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const loadPayment = usePaymentsStore(s => s.loadPayment);
    const payment = usePaymentsStore(s => s.payment);
    useEffect(() => {
        loadPayment(id);
    }, [id])

    const onHomePress = () => {
        router.replace('/(tabs)')
    }

    if(!payment) return <LoadingScreen/>

    return(
        <TESTRECEIPT
            payment={payment}
            onHomePress={onHomePress}
        />
    )

}

const TESTRECEIPT = ({
    payment,
    onHomePress
}) => {
    const { receipt, offer, user, business } = payment;
    
    return(
        <View>
            { payment && 
                <View>
                    <Text>PAYMENT RECEIPT</Text>
                    <Text>Reference No: {payment.id}</Text>
                    <Text>Amount: P{receipt.amount}.00</Text>
                    <Text>Date: {receipt.paidOn.toString()}</Text>
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