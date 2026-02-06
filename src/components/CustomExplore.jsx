import { View } from "react-native"
import CustomHeader from "./CustomHeader"

const CustomExplore = ({
    children
}) => {
    return(
        <View>
            <CustomHeader 
                title="Explore"
                showDefaultIcons={true} 
            />

            { children }
        </View>
    )
}

export default function CallExplore(){
    <CustomExplore>
        <View>

        </View>
    </CustomExplore>
}