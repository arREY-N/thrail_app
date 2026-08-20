import { db } from "@/src/core/config/Firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, Linking } from "react-native";

export default function useMaintenance() {
    const [url, setUrl] = useState<string | null>(null);
    const [isMaintenance, setIsMaintenance] = useState<boolean>(false);
    const [checked, setChecked] = useState<boolean>(false);

    useEffect(() => {
        let isSubscribed = true;

        // Safety timeout (3s) to unblock UI if network or Firestore hangs on startup
        const timeoutId = setTimeout(() => {
            if (isSubscribed) {
                setChecked(true);
            }
        }, 3000);

        const fetch = async () => {
            try {
                const docRef = doc(db, "deployment", "status");
                const docSnap = await getDoc(docRef);

                if (isSubscribed && docSnap.exists()) {
                    const data = docSnap.data();
                    console.log("Document data:", data);
                    setUrl(data.url ?? null);
                    setIsMaintenance(data.maintenance ?? false);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                if (isSubscribed) {
                    clearTimeout(timeoutId);
                    setChecked(true);
                }
            }
        }

        fetch();

        return () => {
            isSubscribed = false;
            clearTimeout(timeoutId);
        };
    }, [])

    const handlePress = async (link?: string | null) => {
        if (!link) return;

        const supported = await Linking.canOpenURL(link);

        if (supported) {
            await Linking.openURL(link);
        } else {
            Alert.alert(`Don't know how to open this URL: ${link}`);
        }
    };

    return { checked, isMaintenance, url, handlePress };
}