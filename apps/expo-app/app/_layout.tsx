import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Providers } from "../components/providers";
import "../global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Providers>
        <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false, animation: "none" }}
        />
        <Stack.Screen
          name="login"
          options={{ headerShown: false, animation: "none" }}
        />
        <Stack.Screen
          name="dashboard"
          options={{
            headerShown: false,
            animation: "none",
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="analytics"
          options={{
            headerShown: false,
            animation: "none",
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            headerShown: false,
            animation: "none",
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: false,
            animation: "none",
            gestureEnabled: false,
          }}
        />
        </Stack>
      </Providers>
    </SafeAreaProvider>
  );
}
