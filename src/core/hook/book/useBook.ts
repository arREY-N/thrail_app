import { Alert } from "react-native";

export type UseBookParams = {
    userId?: string,
    bookingId?: string,
}

export default function useBook(params: UseBookParams = {}) {
    Alert.alert('useBook() is to be deprecated. Remove any usage of this hook. Report an issue if replacement hook is needed');
}