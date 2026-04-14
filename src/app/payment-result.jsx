import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

export default function PaymentResult() {
    const router = useRouter();
    
    useEffect(() => {
        // If testing on the Web browser, this handles closing the auth pop-up window
        // and returning control back to the main app tab holding PaymentScreen.
        WebBrowser.maybeCompleteAuthSession();

        // Automatically close this invisible screen right after the deep link lands here.
        // This reveals the PaymentScreen (Status tab) that is already loaded underneath!
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/hike');
        }
    }, [router]);

    return null;
}
