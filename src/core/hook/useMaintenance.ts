import { db } from "@/src/core/config/Firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, Linking } from "react-native";

export default function useMaintenance() {
    const [url, setUrl] = useState<string>("https://www.youtube.com/watch?v=BBpIV9A1PXc&list=RDBBpIV9A1PXc&start_radio=1");
    const [isMaintenance, setIsMaintenance] = useState<boolean>(false);
    const [checked, setChecked] = useState<boolean>(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                const docRef = doc(db, "deployment", "status");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    console.log("Document data:", data);
                    setUrl(data.url ?? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1');
                    setIsMaintenance(data.maintenance ?? false);
                    console.log(data);
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setChecked(true);
            }
        }

        fetch();
    },[])

    const handlePress = async (link: string) => {
        const supported = await Linking.canOpenURL(link);

        if (supported) {
            await Linking.openURL(link);
        } else {
            Alert.alert(`Don't know how to open this URL: ${link}`);
        }
    };

    return { checked, isMaintenance, url, handlePress };
}