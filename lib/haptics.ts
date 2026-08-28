import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

function run(effect: () => Promise<void>) { if (Platform.OS !== "web") effect().catch(() => undefined); }
export const haptic = {
  light: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  selection: () => run(() => Haptics.selectionAsync()),
};
