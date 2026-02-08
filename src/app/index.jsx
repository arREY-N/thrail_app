import { Redirect } from 'expo-router';

export default function Index() {
  // jsut to bypass log in screen for now, will remove when we have the login screen working
  return <Redirect href="/(tabs)/map" />;
}