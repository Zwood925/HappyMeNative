import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAppTheme } from "@/hooks/use-app-theme";
import { HappyProvider } from "@/lib/happy-store";

function AppNavigator() {
  const { colors, isDark } = useAppTheme();
  return <><StatusBar style={isDark ? "light" : "dark"} /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: "slide_from_right" }}><Stack.Screen name="(tabs)" /><Stack.Screen name="compose" options={{ presentation: "modal", animation: "slide_from_bottom" }} /><Stack.Screen name="moment/[id]" /><Stack.Screen name="pod/[id]" /><Stack.Screen name="encouragement/compose" options={{ presentation: "modal", animation: "slide_from_bottom" }} /></Stack></>;
}
export default function RootLayout() { return <GestureHandlerRootView style={{ flex: 1 }}><HappyProvider><AppNavigator /></HappyProvider></GestureHandlerRootView>; }
