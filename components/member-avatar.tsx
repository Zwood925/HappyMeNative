import { StyleSheet, Text, View } from "react-native";
import type { Member } from "@/lib/domain";

export function MemberAvatar({ member, size = 38 }: { member: Member; size?: number }) {
  return <View accessibilityLabel={member.name} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: member.color }]}><Text style={[styles.initials, { fontSize: Math.max(10, size * 0.29) }]}>{member.initials}</Text></View>;
}
const styles = StyleSheet.create({ avatar: { alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.88)" }, initials: { color: "#FFFFFF", fontWeight: "900" } });
