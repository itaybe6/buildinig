import { loginFormSchema, type LoginFormValues } from "@my-project/shared";
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
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    setBusy(false);
    if (error) {
      Alert.alert("התחברות נכשלה", error.message);
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

    Alert.alert(
      "ממשק דפדפן",
      "חשבון מנהל — נא להשתמש באתר הניהול.",
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
        דיירים ועובדי שטח — כניסה עם האימייל והסיסמה
      </Text>

      <View className="mb-4">
        <Text className="mb-1 font-medium">אימייל</Text>
        <Controller
          control={form.control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="rounded-lg border border-gray-300 px-3 py-2 text-left"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        {form.formState.errors.email ? (
          <Text className="mt-1 text-sm text-red-600">
            {form.formState.errors.email.message}
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
