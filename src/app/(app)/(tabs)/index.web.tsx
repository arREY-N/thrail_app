/**
 * @file index.tsx
 * @description Controller for the Home Tab. Connects domain hooks and navigation to the pure HomeScreen UI.
 */
import HomePage from "@/src/features/Web/Home/HomePage";

/**
 * Controller for the Home Tab.
 * Connects domain hooks and navigation to the pure HomeScreen UI.
 *
 * @returns React.JSX.Element rendering the Home tab controller.
 */

export default function home() {
	return (
		<HomePage />
	);
}
