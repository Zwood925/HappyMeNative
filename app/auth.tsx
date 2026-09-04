import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AppIcon } from "@/components/app-icon";
import { AppScreen } from "@/components/app-screen";
import { useAppTheme } from "@/hooks/use-app-theme";
import { validatePassword } from "@/lib/auth-validation";
import { useAuth } from "@/lib/auth";
import { haptic } from "@/lib/haptics";

function friendlyMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  if (/invalid login credentials/i.test(message)) return "That email and password did not match.";
  if (/already registered/i.test(message)) return "An account already exists for that email.";
  return message;
}

export default function AuthScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { configured, signIn, signUp, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [confirmationSent, setConfirmationSent] = useState(false);
  const passwordError = mode === "signup" ? validatePassword(password) : null;
  const canSubmit = configured && email.trim().includes("@") && password.length >= (mode === "signup" ? 8 : 1) && (mode === "signin" || (name.trim().length > 0 && password === confirm));

  async function submit() {
    if (!canSubmit || busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      if (mode === "signin") await signIn(email, password);
      else {
        const result = await signUp({ email, password, displayName: name });
        if (result.needsEmailConfirmation) { setConfirmationSent(true); haptic.success(); return; }
      }
      haptic.success(); router.replace("/" as never);
    } catch (cause) { setError(friendlyMessage(cause)); haptic.error(); }
    finally { setBusy(false); }
  }

  async function forgotPassword() {
    if (!email.trim().includes("@")) { setError("Enter your email address first."); return; }
    setBusy(true); setError(""); setNotice("");
    try { await requestPasswordReset(email); setNotice("Check your email for a secure password-reset link."); haptic.success(); }
    catch (cause) { setError(friendlyMessage(cause)); haptic.error(); }
    finally { setBusy(false); }
  }

  if (confirmationSent) return <AppScreen edges={["top", "bottom", "left", "right"]}><View style={styles.center}><View style={[styles.heroIcon, { backgroundColor: colors.primary }]}><AppIcon name="mail-open-outline" size={34} color={colors.ink} /></View><Text style={[styles.title, { color: colors.ink }]}>Check your email</Text><Text style={[styles.subtitle, { color: colors.muted }]}>Tap the confirmation link for <Text style={{ fontWeight: "800", color: colors.ink }}>{email.trim()}</Text>, then return to HappyMe.</Text><Pressable onPress={() => { setConfirmationSent(false); setMode("signin"); }} style={[styles.secondaryButton, { borderColor: colors.border }]}><Text style={[styles.secondaryText, { color: colors.ink }]}>Back to sign in</Text></Pressable></View></AppScreen>;

  return <AppScreen edges={["top", "bottom", "left", "right"]}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}><View style={styles.brand}><View style={[styles.heroIcon, { backgroundColor: colors.primary }]}><AppIcon name="sparkles" size={30} color={colors.ink} /></View><Text style={[styles.eyebrow, { color: colors.coral }]}>A SOFTER KIND OF SOCIAL</Text><Text style={[styles.title, { color: colors.ink }]}>{mode === "signin" ? "Welcome back." : "Keep joy together."}</Text><Text style={[styles.subtitle, { color: colors.muted }]}>{mode === "signin" ? "Sign in to your private moments and close circles." : "Create a private HappyMe account. No follower counts, no public score."}</Text></View><View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.modeRow, { backgroundColor: colors.surfaceAlt }]}>{(["signin", "signup"] as const).map((item) => <Pressable key={item} onPress={() => { setMode(item); setError(""); setNotice(""); }} style={[styles.mode, item === mode && { backgroundColor: colors.ink }]}><Text style={[styles.modeText, { color: item === mode ? colors.background : colors.muted }]}>{item === "signin" ? "Sign in" : "Create account"}</Text></Pressable>)}</View>{mode === "signup" ? <TextInput accessibilityLabel="Display name" autoCapitalize="words" value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.ink, backgroundColor: colors.background, borderColor: colors.border }]} /> : null}<TextInput accessibilityLabel="Email address" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.ink, backgroundColor: colors.background, borderColor: colors.border }]} /><TextInput accessibilityLabel="Password" secureTextEntry value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.ink, backgroundColor: colors.background, borderColor: colors.border }]} />{mode === "signup" ? <TextInput accessibilityLabel="Confirm password" secureTextEntry value={confirm} onChangeText={setConfirm} placeholder="Confirm password" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.ink, backgroundColor: colors.background, borderColor: password && confirm && password !== confirm ? colors.danger : colors.border }]} /> : null}{mode === "signup" && passwordError ? <Text style={[styles.helper, { color: colors.muted }]}>{passwordError}</Text> : null}{mode === "signup" && confirm && password !== confirm ? <Text style={[styles.error, { color: colors.danger }]}>Passwords do not match.</Text> : null}{mode === "signin" ? <Pressable onPress={forgotPassword} disabled={busy} style={styles.forgot}><Text style={[styles.forgotText, { color: colors.coral }]}>Forgot password?</Text></Pressable> : null}{notice ? <Text accessibilityRole="alert" style={[styles.notice, { color: colors.mint }]}>{notice}</Text> : null}{error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}{!configured ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>HappyMe cloud configuration is unavailable in this build.</Text> : null}<Pressable disabled={!canSubmit || busy} onPress={submit} style={({ pressed }) => [styles.primaryButton, { backgroundColor: canSubmit ? colors.primary : colors.border, opacity: pressed ? 0.76 : 1 }]}>{busy ? <ActivityIndicator color={colors.ink} /> : <><Text style={[styles.primaryText, { color: colors.ink }]}>{mode === "signin" ? "Sign in" : "Create my account"}</Text><AppIcon name="arrow-forward" size={19} color={colors.ink} /></>}</Pressable></View><View style={styles.promise}><AppIcon name="shield-checkmark-outline" size={18} color={colors.mint} /><Text style={[styles.promiseText, { color: colors.muted }]}>Your reflections are private to you unless you choose a pod.</Text></View></ScrollView></KeyboardAvoidingView></AppScreen>;
}

const styles = StyleSheet.create({ flex: { flex: 1 }, scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 22, paddingVertical: 34, gap: 22 }, center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30 }, brand: { alignItems: "center" }, heroIcon: { width: 68, height: 68, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 17 }, eyebrow: { fontSize: 13, lineHeight: 18, letterSpacing: 1.4, fontWeight: "900", marginBottom: 7 }, title: { fontSize: 32, lineHeight: 39, fontWeight: "900", letterSpacing: -0.7, textAlign: "center" }, subtitle: { fontSize: 15, lineHeight: 22, textAlign: "center", maxWidth: 340, marginTop: 8 }, card: { borderRadius: 28, borderWidth: 1, padding: 16, gap: 12 }, modeRow: { flexDirection: "row", borderRadius: 18, padding: 4, marginBottom: 2 }, mode: { flex: 1, minHeight: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" }, modeText: { fontSize: 15, lineHeight: 21, fontWeight: "900" }, input: { minHeight: 53, borderRadius: 17, borderWidth: 1, paddingHorizontal: 15, fontSize: 15, lineHeight: 21 }, helper: { fontSize: 13, lineHeight: 20, marginHorizontal: 4 }, error: { fontSize: 15, lineHeight: 20, fontWeight: "700", marginHorizontal: 4 }, notice: { fontSize: 15, lineHeight: 20, fontWeight: "800", marginHorizontal: 4 }, forgot: { alignSelf: "flex-end", minHeight: 44, justifyContent: "center", paddingHorizontal: 3 }, forgotText: { fontSize: 15, lineHeight: 20, fontWeight: "900" }, primaryButton: { minHeight: 54, borderRadius: 27, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 3 }, primaryText: { fontSize: 15, lineHeight: 20, fontWeight: "900" }, secondaryButton: { minHeight: 50, borderWidth: 1, borderRadius: 25, alignItems: "center", justifyContent: "center", alignSelf: "stretch", marginTop: 24 }, secondaryText: { fontSize: 15, lineHeight: 22, fontWeight: "900" }, promise: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 18 }, promiseText: { fontSize: 13, lineHeight: 20, flexShrink: 1 } });
