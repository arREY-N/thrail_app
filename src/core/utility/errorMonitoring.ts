import * as Sentry from "@sentry/react-native";

/**
 * Initializes Sentry error monitoring with environment tagging,
 * offline caching, and privacy-preserving settings.
 */
export const initErrorMonitoring = (): void => {
	const dsn =
		process.env.EXPO_PUBLIC_SENTRY_DSN ||
		"https://2edef124e1ec5672248e80d13b506aa3@o4512242120523776.ingest.us.sentry.io/4512242150670336";

	if (!dsn) {
		if (__DEV__) {
			console.warn("[Sentry] No DSN provided; error monitoring is disabled.");
		}
		return;
	}

	Sentry.init({
		dsn,

		// Clearly distinguish dev errors from production crash metrics
		environment: __DEV__ ? "development" : (process.env.EXPO_PUBLIC_ENV || "production"),

		// Anonymous error tracking: do not automatically send IP address or device PII
		sendDefaultPii: false,

		// Enable diagnostic console logs during development only
		enableLogs: __DEV__,

		// Session replay configuration
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,

		integrations: [
			Sentry.mobileReplayIntegration(),
			Sentry.feedbackIntegration(),
		],

		beforeSend(event) {
			// Ensure sensitive data scrubbing if needed before sending to Sentry
			return event;
		},
	});
};

/**
 * Attaches or clears the anonymous user identifier (Firebase UID) in Sentry.
 * Does not send emails, names, or location PII.
 */
export const setUserTracking = (uid: string | null | undefined): void => {
	if (uid) {
		Sentry.setUser({ id: uid });
	} else {
		Sentry.setUser(null);
	}
};

/**
 * Global helper to report non-fatal caught exceptions with diagnostic context.
 */
export const captureAppError = (
	error: unknown,
	context?: Record<string, unknown>
): void => {
	if (error instanceof Error) {
		Sentry.captureException(error, {
			extra: context,
		});
	} else {
		Sentry.captureMessage(typeof error === "string" ? error : JSON.stringify(error), {
			level: "error",
			extra: context,
		});
	}
};

export { Sentry };
