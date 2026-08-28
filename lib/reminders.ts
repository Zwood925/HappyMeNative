import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
  });
}

async function cancelJoyReminders() {
  if (Platform.OS === "web") return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter((item) => item.content.data?.kind === "joy-reminder").map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
}

export async function updateDailyReminder(enabled: boolean): Promise<"enabled" | "disabled" | "unavailable" | "denied"> {
  if (Platform.OS === "web") return "unavailable";
  await cancelJoyReminders();
  if (!enabled) return "disabled";
  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.status === "granted" ? existing : await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted") return "denied";
  await Notifications.scheduleNotificationAsync({
    content: { title: "A small moment for you", body: "What felt a little good today?", data: { kind: "joy-reminder" } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 30 },
  });
  return "enabled";
}
