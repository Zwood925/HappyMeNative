import { useColorScheme } from "react-native";
import { darkPalette, lightPalette, type AppPalette } from "@/constants/palette";
import { useHappy } from "@/lib/happy-store";

export function useAppTheme(): { colors: AppPalette; isDark: boolean } {
  const systemScheme = useColorScheme();
  const { state } = useHappy();
  const preference = state.preferences.appearance;
  const isDark = preference === "dark" || (preference === "system" && systemScheme === "dark");
  return { colors: isDark ? darkPalette : lightPalette, isDark };
}
