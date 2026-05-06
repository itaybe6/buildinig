import {
  loginFormSchema,
  type LoginFormValues,
} from "@my-project/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { getExpoExtra } from "@/src/theme/getExpoExtra";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { phone: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setBusy(true);
    const extra = getExpoExtra();
    const webOrigin =
      extra.EXPO_PUBLIC_WEB_API_ORIGIN?.trim() ||
      process.env.EXPO_PUBLIC_WEB_API_ORIGIN?.trim() ||
      "";
    if (!webOrigin) {
      setBusy(false);
      Alert.alert(
        "הגדרה חסרה",
        "הוסף EXPO_PUBLIC_WEB_API_ORIGIN לקובץ env (כתובת שרת הווב, למשל http://192.168.1.5:3000)."
      );
      return;
    }

    const loginUrl = `${webOrigin.replace(/\/$/, "")}/api/auth/login`;
    let res: Response;
    try {
      res = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: values.phone,
          password: values.password,
        }),
      });
    } catch (e) {
      setBusy(false);
      Alert.alert(
        "התחברות נכשלה",
        e instanceof Error ? e.message : "לא ניתן להגיע לשרת הווב"
      );
      return;
    }

    let payload: { error?: string; session?: { access_token: string; refresh_token: string } } =
      {};
    try {
      payload = await res.json();
    } catch {
      setBusy(false);
      Alert.alert("התחברות נכשלה", "תגובת השרת לא תקינה");
      return;
    }

    if (!res.ok || !payload.session) {
      setBusy(false);
      Alert.alert("התחברות נכשלה", payload.error ?? `קוד ${res.status}`);
      return;
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: payload.session.access_token,
      refresh_token: payload.session.refresh_token,
    });
    setBusy(false);
    if (sessionError) {
      Alert.alert("התחברות נכשלה", sessionError.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert("שגיאה", "לא נמצא משתמש");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    const role = profile?.role;

    if (role === "super_admin") {
      router.replace("/(super-admin)/dashboard");
      return;
    }
    if (role === "employee") {
      router.replace("/(employee)/assignments");
      return;
    }
    if (role === "resident") {
      router.replace("/(resident)/home");
      return;
    }
    if (role === "manager") {
      router.replace("/(manager)/dashboard");
      return;
    }

    Alert.alert(
      "ממשק דפדפן",
      "חשבון זה אינו נתמך באפליקציה.",
      [{ text: "אישור", onPress: () => supabase.auth.signOut() }]
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white px-4 pt-16"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="mb-6 text-center text-2xl font-bold">התחברות</Text>
      <Text className="mb-6 text-center text-gray-600">
        דיירים, עובדי שטח ומנהלי נכסים — כניסה עם מספר הטלפון והסיסמה
      </Text>

      <View className="mb-4">
        <Text className="mb-1 font-medium">מספר טלפון</Text>
        <Controller
          control={form.control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="rounded-lg border border-gray-300 px-3 py-2 text-left"
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="telephoneNumber"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {form.formState.errors.phone ? (
          <Text className="mt-1 text-sm text-red-600">
            {form.formState.errors.phone.message}
          </Text>
        ) : null}
      </View>

      <View className="mb-6">
        <Text className="mb-1 font-medium">סיסמה</Text>
        <Controller
          control={form.control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="rounded-lg border border-gray-300 px-3 py-2 text-left"
              secureTextEntry
              textContentType="password"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {form.formState.errors.password ? (
          <Text className="mt-1 text-sm text-red-600">
            {form.formState.errors.password.message}
          </Text>
        ) : null}
      </View>

      <Pressable
        className="rounded-lg bg-blue-600 py-3 disabled:opacity-50"
        disabled={busy}
        onPress={form.handleSubmit(onSubmit)}
      >
        <Text className="text-center font-semibold text-white">
          {busy ? "מתחבר…" : "התחבר"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
