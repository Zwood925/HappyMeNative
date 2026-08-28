import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import type { ColorValue, StyleProp, TextStyle } from "react-native";
export type AppIconName = ComponentProps<typeof Ionicons>["name"];
export function AppIcon({ name, size = 22, color, style }: { name: AppIconName; size?: number; color: ColorValue; style?: StyleProp<TextStyle> }) { return <Ionicons name={name} size={size} color={color} style={style} />; }
