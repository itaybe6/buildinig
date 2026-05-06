import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => void handleLogout()}
      className="rounded-md px-2 py-1 active:opacity-70"
    >
      <Text className="text-base font-medium text-blue-600">התנתק</Text>
    </Pressable>
  );
}
