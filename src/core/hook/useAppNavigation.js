import { useRouter } from "expo-router";

export function useAppNavigation(){
    const router = useRouter();

    const onMountainPress = (id) => {
        console.log('Routing to: ', id);
        router.push(`/(mountain)/${id}`)
    }

    const onBackPress = () => {
        router.back();
    }

    const onDownloadPress = (id) => {
        console.log('Downloading: ', id);
    }

    return{
        onMountainPress,
        onBackPress,
        onDownloadPress
    }
}