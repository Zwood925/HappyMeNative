import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon, type AppIconName } from "@/components/app-icon";
import { HapticTab } from "@/components/haptic-tab";
import { useAppTheme } from "@/hooks/use-app-theme";

const tabs: { name: string; title: string; icon: AppIconName; activeIcon: AppIconName }[] = [
  { name: "index", title: "Today", icon: "sunny-outline", activeIcon: "sunny" }, { name: "garden", title: "Garden", icon: "calendar-outline", activeIcon: "calendar" },
  { name: "pods", title: "Pods", icon: "people-outline", activeIcon: "people" }, { name: "kindness", title: "Kindness", icon: "heart-outline", activeIcon: "heart" },
  { name: "profile", title: "You", icon: "person-circle-outline", activeIcon: "person-circle" },
];
export default function TabLayout() {
  const { colors } = useAppTheme(); const insets = useSafeAreaInsets(); const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  return <Tabs screenOptions={{ headerShown: false, tabBarButton: HapticTab, tabBarActiveTintColor: colors.ink, tabBarInactiveTintColor: colors.muted, tabBarLabelStyle: styles.label, tabBarItemStyle: styles.item, tabBarStyle: [styles.bar, { height: 58 + bottomPadding, paddingBottom: bottomPadding, backgroundColor: colors.surface, borderTopColor: colors.border }] }}>{tabs.map((tab) => <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title, tabBarIcon: ({ color, focused }) => <AppIcon name={focused ? tab.activeIcon : tab.icon} size={23} color={color} /> }} />)}</Tabs>;
}
const styles = StyleSheet.create({ bar: { paddingTop: 7, borderTopWidth: StyleSheet.hairlineWidth }, item: { paddingTop: 1 }, label: { fontSize: 10, lineHeight: 13, fontWeight: "700" } });
