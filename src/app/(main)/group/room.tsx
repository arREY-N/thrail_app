import CustomTextInput from "@/src/components/CustomTextInput";
import { useGroup } from "@/src/core/hook/group/useGroup";
import { Message } from "@/src/core/models/Message/Message";
import { formatDate } from "@/src/core/utility/date";
import getSearchParam from "@/src/core/utility/getSearchParam";
import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { FlatList, Pressable, Text, View, ViewToken } from "react-native";

export default function groupRoom() {
    const { roomId: rawId } = useLocalSearchParams();
    
    const roomId = getSearchParam(rawId);

    const { 
        messages, 
        sendMessage,
        onViewableItemsChanged
    } = useGroup(roomId);

    
    return(
        <TestGroupRoom
            roomId={roomId}
            messages={messages}
            sendMessage={sendMessage}
            onViewableItemsChanged={onViewableItemsChanged}
        />
    )
}

export type GroupRoomParams = {
    roomId: string;
    messages: Message[];
    sendMessage: (content: string) => void;
    onViewableItemsChanged?: (info: { 
        viewableItems: ViewToken[]; 
        changed: ViewToken[]; 
    }) => void;
}

export const TestGroupRoom = (params: GroupRoomParams) => {
    const [content, setContent] = useState('');

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 300
    }).current

    const renderMessage = (item: Message) => {
        return(
            <View style={{ padding: 10 }}>
                <Text style={{ fontSize: 16 }}>{item.content}</Text>
                <Text style={{ fontSize: 14, color: '#666' }}>{item.senderName}</Text>
                <Text style={{ fontSize: 12, color: '#999' }}>{formatDate(item.timesent)}</Text>
                {item.readBy.length > 0 && (
                    <Text style={{ fontSize: 12, color: '#999' }}>{(item.readBy || ['']).map(u => u.username).join(', ')}</Text>
                )}
            </View>
        )
    }
    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text>Group Room - {params.roomId}</Text>

            <CustomTextInput 
                label={'message'} 
                placeholder={'Enter message'} 
                value={content} 
                onChangeText={setContent} 
                secureTextEntry={undefined} 
                keyboardType={undefined} 
                isPasswordVisible={undefined} 
                onTogglePassword={undefined} 
                style={undefined} 
                inputStyle={undefined} 
                icon={undefined} 
                prefix={undefined} 
                children={undefined} 
                showTodayButton={undefined} 
                allowFutureDates={undefined} 
                multiline={undefined}            
            />

            <Pressable onPress={() => params.sendMessage(content)}>
                <Text>Send Message</Text>
            </Pressable>

            <FlatList
                data={params.messages}
                renderItem={({ item }) => renderMessage(item)}
                keyExtractor={(item) => item.id}
                onViewableItemsChanged={params.onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
            />
        </View>
    )
}