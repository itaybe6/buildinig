import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

const ITEMS: { label: string; path: string }[] = [
  { label: "דיירים", path: "/(manager)/more/residents" },
  { label: "עובדים", path: "/(manager)/more/employees" },
  { label: "לוח מודעות", path: "/(manager)/more/announcements" },
  { label: "תשלומים", path: "/(manager)/more/payments" },
  { label: "הגדרות תשלום", path: "/(manager)/more/payment-settings" },
  { label: "סוגי שירות", path: "/(manager)/more/service-types" },
  { label: "פרופיל", path: "/(manager)/more/profile" },
  { label: "הגדרות ארגון", path: "/(manager)/more/tenant-settings" },
];

export default function ManagerMoreMenuScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-4">
      <Text className="mb-4 text-sm text-gray-600">
        כלים נוספים לניהול הארגון
      </Text>
      <View className="gap-2 pb-8">
        {ITEMS.map((item) => (
          <Pressable
            key={item.path}
            onPress={() => router.push(item.path as never)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-4 active:bg-slate-50"
          >
            <Text className="text-base font-medium">{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
