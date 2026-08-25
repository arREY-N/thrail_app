import CustomLoading from "@/src/components/CustomLoading";

const LoadingScreen = () => {
    return(
        <CustomLoading
            visible={true}
            message="Loading..."
        />
    )
}

export default LoadingScreen