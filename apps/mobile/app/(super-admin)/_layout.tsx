import { LogoutButton } from "@/components/LogoutButton";
import { Drawer } from "expo-router/drawer";

export default function SuperAdminDrawerLayout() {
  return (
    <Drawer
      initialRouteName="dashboard"
      screenOptions={{
        drawerPosition: "right",
        headerTitleAlign: "center",
        drawerActiveTintColor: "#2563eb",
        headerRight: () => <LogoutButton />,
      }}
    />
  );
}
