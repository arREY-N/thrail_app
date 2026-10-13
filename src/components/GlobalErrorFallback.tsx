import React, { useState } from "react";
import {
	SafeAreaView,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View,
} from "react-native";
import CustomButton from "@/src/components/CustomButton";
import CustomIcon from "@/src/components/CustomIcon";
import CustomText from "@/src/components/CustomText";
import { Colors } from "@/src/constants/colors";
import { router } from "expo-router";

export interface GlobalErrorFallbackProps {
	error: Error;
	resetError: () => void;
}

export const GlobalErrorFallback: React.FC<GlobalErrorFallbackProps> = ({
	error,
	resetError,
}) => {
	const [showDetails, setShowDetails] = useState(false);

	const handleGoHome = () => {
		resetError();
		try {
			router.replace("/(app)/(tabs)");
		} catch {
			// Fallback if router not yet ready
		}
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView
				contentContainerStyle={styles.container}
				bounces={false}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.iconCircle}>
					<CustomIcon
						library="Feather"
						name="alert-triangle"
						size={48}
						color={Colors.ERROR || "#DC2626"}
					/>
				</View>

				<CustomText variant="h2" style={styles.title}>
					Something went wrong
				</CustomText>

				<CustomText variant="body" style={styles.subtitle}>
					An unexpected problem occurred. The issue has been automatically reported
					to our team so we can look into it.
				</CustomText>

				<View style={styles.buttonContainer}>
					<CustomButton
						title="Try Again"
						onPress={resetError}
						type="primary"
						style={styles.primaryButton}
					/>
					<CustomButton
						title="Back to Home"
						onPress={handleGoHome}
						type="secondary"
						style={styles.secondaryButton}
					/>
				</View>

				{__DEV__ && (
					<View style={styles.devCard}>
						<TouchableOpacity
							onPress={() => setShowDetails(!showDetails)}
							style={styles.devHeader}
							activeOpacity={0.7}
						>
							<CustomText variant="caption" style={styles.devTitle}>
								{showDetails ? "▼ Hide Technical Details" : "▶ Show Technical Details (Dev Only)"}
							</CustomText>
						</TouchableOpacity>

						{showDetails && (
							<View style={styles.devBody}>
								<CustomText variant="caption" style={styles.errorName}>
									{error?.name}: {error?.message}
								</CustomText>
								{error?.stack && (
									<CustomText variant="caption" style={styles.errorStack}>
										{error.stack}
									</CustomText>
								)}
							</View>
						)}
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#F8FAFC",
	},
	container: {
		flexGrow: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 24,
		paddingVertical: 32,
	},
	iconCircle: {
		width: 96,
		height: 96,
		borderRadius: 48,
		backgroundColor: "#FEE2E2",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 24,
	},
	title: {
		textAlign: "center",
		marginBottom: 8,
		color: "#0F172A",
		fontWeight: "700",
	},
	subtitle: {
		textAlign: "center",
		color: "#64748B",
		marginBottom: 32,
		lineHeight: 22,
		maxWidth: 320,
	},
	buttonContainer: {
		width: "100%",
		maxWidth: 320,
		gap: 12,
		marginBottom: 24,
	},
	primaryButton: {
		width: "100%",
	},
	secondaryButton: {
		width: "100%",
	},
	devCard: {
		width: "100%",
		backgroundColor: "#1E293B",
		borderRadius: 8,
		padding: 12,
		marginTop: 16,
	},
	devHeader: {
		paddingVertical: 4,
	},
	devTitle: {
		color: "#38BDF8",
		fontWeight: "600",
	},
	devBody: {
		marginTop: 8,
		paddingTop: 8,
		borderTopWidth: 1,
		borderTopColor: "#334155",
	},
	errorName: {
		color: "#F87171",
		fontWeight: "600",
		marginBottom: 6,
		fontFamily: "monospace",
	},
	errorStack: {
		color: "#94A3B8",
		fontFamily: "monospace",
		fontSize: 11,
		lineHeight: 16,
	},
});

export default GlobalErrorFallback;
