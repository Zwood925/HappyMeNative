import { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, Easing, Modal, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "@/components/app-icon";

interface JoyBloomProps {
  visible: boolean;
  onComplete?: () => void;
}

const petals = [
  { top: 24, left: 97, rotate: "0deg", color: "#F6B84A" },
  { top: 49, left: 145, rotate: "60deg", color: "#F27C72" },
  { top: 101, left: 145, rotate: "120deg", color: "#9E8BD8" },
  { top: 128, left: 97, rotate: "180deg", color: "#72BFA3" },
  { top: 101, left: 49, rotate: "240deg", color: "#6EA8D9" },
  { top: 49, left: 49, rotate: "300deg", color: "#F7D77E" },
];

export function JoyBloom({ visible, onComplete }: JoyBloomProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const bloomScale = useRef(new Animated.Value(0.72)).current;
  const petalScale = useRef(new Animated.Value(0.2)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    opacity.setValue(0);
    bloomScale.setValue(0.72);
    petalScale.setValue(0.2);
    rotation.setValue(0);

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
          Animated.timing(bloomScale, { toValue: 1, duration: reduceMotion ? 160 : 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(petalScale, { toValue: 1, duration: reduceMotion ? 160 : 430, delay: reduceMotion ? 0 : 70, easing: Easing.out(Easing.back(1.25)), useNativeDriver: true }),
          Animated.timing(rotation, { toValue: reduceMotion ? 0 : 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.delay(reduceMotion ? 520 : 900),
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished && !cancelled) completeRef.current?.(); });
    });

    return () => {
      cancelled = true;
      opacity.stopAnimation();
      bloomScale.stopAnimation();
      petalScale.stopAnimation();
      rotation.stopAnimation();
    };
  }, [bloomScale, opacity, petalScale, rotation, visible]);

  if (!visible) return null;
  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ["-12deg", "4deg"] });

  return <Modal transparent visible statusBarTranslucent animationType="none" accessibilityViewIsModal>
    <Animated.View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.card, { transform: [{ scale: bloomScale }] }]}>
        <View style={styles.bloom}>
          <Animated.View style={[styles.halo, { transform: [{ scale: bloomScale }] }]} />
          {petals.map((petal) => <Animated.View key={petal.rotate} style={[styles.petal, { top: petal.top, left: petal.left, backgroundColor: petal.color, transform: [{ scale: petalScale }, { rotate: petal.rotate }] }]} />)}
          <Animated.View style={[styles.sun, { transform: [{ rotate }] }]}><AppIcon name="sparkles" size={34} color="#34263A" /></Animated.View>
        </View>
        <Text style={styles.title}>A little light, kept.</Text>
        <Text style={styles.subtitle}>Your joy garden just grew.</Text>
      </Animated.View>
    </Animated.View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(52,38,58,0.18)", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  card: { width: "100%", maxWidth: 300, minHeight: 310, borderRadius: 44, backgroundColor: "#34263A", alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingBottom: 30, shadowColor: "#34263A", shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 10 },
  bloom: { width: 220, height: 176, position: "relative" },
  halo: { position: "absolute", width: 126, height: 126, borderRadius: 63, left: 47, top: 33, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", backgroundColor: "rgba(246,184,74,0.08)" },
  petal: { position: "absolute", width: 28, height: 54, borderRadius: 18 },
  sun: { position: "absolute", left: 78, top: 63, width: 64, height: 64, borderRadius: 32, backgroundColor: "#FFF4C9", alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "#F6B84A" },
  title: { color: "#FFFFFF", fontSize: 24, lineHeight: 30, fontWeight: "900", letterSpacing: -0.45, textAlign: "center" },
  subtitle: { color: "rgba(255,255,255,0.72)", fontSize: 13, lineHeight: 19, fontWeight: "600", marginTop: 4, textAlign: "center" },
});
