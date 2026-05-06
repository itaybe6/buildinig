import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

type BuildingRow = {
  id: string;
  name: string;
  address: string;
  city: string;
  floors_count: number;
};

export default function TenantBuildingsScreen() {
  const { id: tenantId, new_tenant: newTenant } = useLocalSearchParams<{
    id: string;
    new_tenant?: string;
  }>();
  const fromNewFlow =
    newTenant === "1" ||
    newTenant === "true" ||
    (Array.isArray(newTenant) && newTenant[0] === "1");
  const router = useRouter();

  const [tenantName, setTenantName] = useState<string>("");
  const [buildings, setBuildings] = useState<BuildingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [floors, setFloors] = useState("1");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);

    const { data: tenant, error: te } = await supabase
      .from("tenants")
      .select("name")
      .eq("id", tenantId)
      .maybeSingle();

    const { data: blist, error: be } = await supabase
      .from("buildings")
      .select("id, name, address, city, floors_count")
      .eq("tenant_id", tenantId)
      .order("name");

    setLoading(false);

    if (te || be || !tenant) {
      Alert.alert("שגיאה", te?.message ?? be?.message ?? "לא נמצא לקוח");
      router.back();
      return;
    }

    setTenantName(tenant.name);
    setBuildings((blist ?? []) as BuildingRow[]);
  }, [tenantId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onAdd() {
    if (!tenantId) return;
    setSaving(true);
    const floorsCount = Math.max(1, Number.parseInt(floors, 10) || 1);
    const { error } = await supabase.from("buildings").insert({
      tenant_id: tenantId,
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      floors_count: floorsCount,
    });
    setSaving(false);
    if (error) {
      Alert.alert("שגיאה", error.message);
      return;
    }
    setName("");
    setAddress("");
    setCity("");
    setFloors("1");
    void load();
  }

  const formHeader = (
    <View className="bg-white px-3 py-3">
      <Text className="mb-4 text-lg font-semibold text-gray-800">
        בניינים — {tenantName}
      </Text>

      {fromNewFlow ? (
        <View className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-3">
          <Text className="font-semibold text-blue-950">העסק נוצר בהצלחה</Text>
          <Text className="mt-1 text-sm leading-relaxed text-blue-900/90">
            הוסיפו בניין אחד או יותר — כל בניין משויך ללקוח שיצרתם.
          </Text>
        </View>
      ) : null}

      <View className="mb-6 gap-2 rounded-xl border border-gray-200 p-4">
        <Text className="mb-2 font-medium">הוספת בניין</Text>
        <Text className="mb-1 text-sm text-gray-600">שם</Text>
        <TextInput
          className="mb-2 rounded-lg border border-gray-300 px-3 py-2 text-left"
          value={name}
          onChangeText={setName}
        />
        <Text className="mb-1 text-sm text-gray-600">כתובת</Text>
        <TextInput
          className="mb-2 rounded-lg border border-gray-300 px-3 py-2 text-left"
          value={address}
          onChangeText={setAddress}
        />
        <Text className="mb-1 text-sm text-gray-600">עיר</Text>
        <TextInput
          className="mb-2 rounded-lg border border-gray-300 px-3 py-2 text-left"
          value={city}
          onChangeText={setCity}
        />
        <Text className="mb-1 text-sm text-gray-600">קומות</Text>
        <TextInput
          className="mb-3 rounded-lg border border-gray-300 px-3 py-2 text-left"
          keyboardType="number-pad"
          value={floors}
          onChangeText={setFloors}
        />
        <Pressable
          className="rounded-lg bg-blue-600 py-3 disabled:opacity-50"
          disabled={saving || !name.trim() || !address.trim() || !city.trim()}
          onPress={() => void onAdd()}
        >
          <Text className="text-center font-semibold text-white">
            {saving ? "שומר…" : "הוסף בניין"}
          </Text>
        </Pressable>
      </View>

      <Text className="mb-2 font-medium">בניינים קיימים</Text>
    </View>
  );

  if (loading || !tenantId) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-white"
      data={buildings}
      keyExtractor={(b) => b.id}
      ListHeaderComponent={formHeader}
      ListEmptyComponent={
        <Text className="px-3 pb-6 text-center text-gray-500">
          אין בניינים עדיין
        </Text>
      }
      renderItem={({ item }) => (
        <View className="mx-3 mb-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <Text className="font-semibold">{item.name}</Text>
          <Text className="text-sm text-gray-600">
            {item.address}, {item.city}
          </Text>
          <Text className="text-sm text-gray-500">
            קומות: {item.floors_count}
          </Text>
        </View>
      )}
    />
  );
}
