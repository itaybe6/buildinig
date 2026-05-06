import { supabase } from "@/lib/supabase";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

type ProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  mobile_phone: string | null;
  role: string;
  is_active: boolean | null;
};

export default function SuperAdminBuildingDetailScreen() {
  const { id: tenantId, buildingId } = useLocalSearchParams<{
    id: string;
    buildingId: string;
  }>();
  const router = useRouter();
  const tid = Array.isArray(tenantId) ? tenantId[0] : tenantId;
  const bid = Array.isArray(buildingId) ? buildingId[0] : buildingId;

  const [tenantName, setTenantName] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [floors, setFloors] = useState<number>(0);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tid || !bid) return;
    setLoading(true);

    const { data: b, error: be } = await supabase
      .from("buildings")
      .select("tenant_id, address, city, floors_count")
      .eq("id", bid)
      .maybeSingle();

    if (be || !b) {
      setLoading(false);
      Alert.alert("שגיאה", be?.message ?? "לא נמצא בניין");
      router.back();
      return;
    }

    if (b.tenant_id !== tid) {
      setLoading(false);
      Alert.alert("שגיאה", "הבניין אינו שייך לעסק זה.");
      router.back();
      return;
    }

    const { data: tn } = await supabase
      .from("business_profiles")
      .select("name")
      .eq("id", tid)
      .maybeSingle();

    const { data: plist, error: pe } = await supabase
      .from("profiles")
      .select("id, full_name, phone, mobile_phone, role, is_active")
      .eq("building_id", bid)
      .order("full_name");

    setLoading(false);

    if (pe) {
      Alert.alert("שגיאה", pe.message);
      return;
    }

    setTenantName(tn?.name ?? null);
    setAddress(b.address);
    setCity(b.city);
    setFloors(b.floors_count);
    setProfiles((plist ?? []) as ProfileRow[]);
  }, [tid, bid, router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !tid || !bid) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-3 py-4">
        <Link href={`/(super-admin)/tenants/${tid}`} asChild>
          <Pressable className="mb-4 self-start py-1 active:opacity-70">
            <Text className="text-[15px] font-semibold text-blue-600">
              חזרה לעסק{tenantName ? ` — ${tenantName}` : ""}
            </Text>
          </Pressable>
        </Link>

        <Text className="mb-1 text-xl font-bold text-gray-900">{address}</Text>
        <Text className="mb-6 text-sm text-gray-600">
          {city} · קומות {floors} · {profiles.length} פרופילים (building_id)
        </Text>

        <Text className="mb-2 font-semibold text-gray-900">
          פרופילים בבניין
        </Text>
        {profiles.length === 0 ? (
          <Text className="text-sm text-gray-500">
            אין פרופילים משויכים לבניין זה.
          </Text>
        ) : (
          profiles.map((p) => (
            <View
              key={p.id}
              className="mb-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3"
            >
              <Text className="font-semibold text-gray-900">{p.full_name}</Text>
              <Text className="text-sm text-gray-600">
                טלפון: {p.phone ?? "—"} · פלאפון: {p.mobile_phone ?? "—"} ·{" "}
                {p.role}
                {p.is_active === false ? " · לא פעיל" : ""}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
