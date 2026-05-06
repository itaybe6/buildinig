import { AddBusinessCard } from "@/components/super-admin/AddBusinessCard";
import { Link, useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function SuperAdminNewTenantScreen() {
  const router = useRouter();

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-100"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Link href="/(super-admin)/tenants" asChild>
          <Pressable className="self-start py-2 active:opacity-70">
            <Text className="text-[15px] font-semibold text-blue-600">
              חזרה לרשימת הלקוחות
            </Text>
          </Pressable>
        </Link>

        <View className="mt-4 rounded-3xl bg-white/80 px-4 py-5 shadow-sm">
          <Text className="text-center text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            סופר־אדמין
          </Text>
          <Text className="mt-2 text-center text-2xl font-bold text-slate-900">
            הוספת לקוח חדש
          </Text>
          <Text className="mt-3 text-center leading-6 text-[15px] text-slate-600">
            אחרי יצירת הלקוח תועברו לשלב הבא: הוספת בניינים. שיוך מנהל לעסק
            (דרך{" "}
            <Text className="font-mono text-xs text-slate-700">
              profiles.business_profile_id
            </Text>
            ) אפשר לבצע בנפרד.
          </Text>
        </View>

        <View className="mt-8 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-md shadow-slate-900/10">
          <AddBusinessCard
            embedded
            onCreated={(tenantId) =>
              router.replace(
                `/(super-admin)/tenants/${tenantId}?new_tenant=1`
              )
            }
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
