import { Text, View } from "react-native";
import CustomButton from "../CustomButton";

const TESTTRAIL = ({
    trail,
    onDownloadPress,
    onBookPress,
    onHikePress
}) => {
    return(
        <View>
            <Text>Trail View</Text>
            <Text>ID: {trail.id}</Text>
            <Text>Name: {trail.name}</Text>
            <Text>Province: {trail.province?.join(',')}</Text>
            <Text>Address: {trail.address}</Text>
            
            <CustomButton title={'Download'} onPress={() => onDownloadPress(trail?.id)}/>
            <CustomButton title={'Book'} onPress={() => onBookPress(trail?.id)}/>
            <CustomButton title={'Hike'} onPress={() => onHikePress(trail?.id)}/>
        </View>

    )
}

export default TESTTRAIL;