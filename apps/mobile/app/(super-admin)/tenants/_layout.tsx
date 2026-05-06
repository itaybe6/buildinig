import { LogoutButton } from "@/components/LogoutButton";
import { Stack } from "expo-router";

export default function TenantsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerRight: () => <LogoutButton />,
      }}
    >
      <Stack.Screen name="index" options={{ title: "לקוחות (מנהלים)" }} />
      <Stack.Screen name="new" options={{ title: "הוספת לקוח חדש" }} />
      <Stack.Screen name="[id]/index" options={{ title: "בקרה על עסק" }} />
      <Stack.Screen
        name="[id]/buildings"
        options={{ title: "בניינים", headerShown: false }}
      />
    </Stack>
  );
}
