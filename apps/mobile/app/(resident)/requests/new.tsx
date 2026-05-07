import { REQUEST_CATEGORY_LABEL } from "@my-project/shared";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import type { ResidentBuildingOption } from "@/lib/resident-building-options";
import { getResidentBuildingOptions } from "@/lib/resident-building-options";
import { resolveTenantScopeForUser } from "@/lib/tenant-context";
import { supabase } from "@/lib/supabase";

const categories = Object.keys(
  REQUEST_CATEGORY_LABEL
) as (keyof typeof REQUEST_CATEGORY_LABEL)[];

export default function NewServiceRequestScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState<ResidentBuildingOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [category, setCategory] =
    useState<keyof typeof REQUEST_CATEGORY_LABEL>("other");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!profile) return;

      const { businessProfileId } = await resolveTenantScopeForUser(
        supabase,
        user.id
      );
      if (!businessProfileId) return;

      const opts = await getResidentBuildingOptions(supabase, {
        profileId: profile.id,
        businessProfileId,
      });
      setBuildings(opts);
      if (opts[0]) setBuildingId(opts[0].buildingId);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit() {
    const t = title.trim();
    if (!t) {
      Alert.alert("חסר נתון", "נא למלא כותרת.");
      return;
    }
    if (!buildingId) {
      Alert.alert("חסר נתון", "אין בניין משויך לפרופיל.");
      return;
    }

    const match = buildings.find((b) => b.buildingId === buildingId);
    if (!match) {
      Alert.alert("שגיאה", "בניין לא תקין.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (!profile) return;

    setSubmitting(true);
    const { error } = await supabase.from("service_requests").insert({
      building_id: buildingId,
      unit_id: match.unitId,
      reported_by: profile.id,
      title: t,
      description: description.trim() || null,
      category,
      status: "open",
      priority: "medium",
    });
    setSubmitting(false);

    if (error) {
      Alert.alert("שגיאה", error.message);
      return;
    }

    router.replace("/(resident)/requests");
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (buildings.length === 0) {
    return (
      <View className="flex-1 justify-center bg-white px-4">
        <Text className="text-center text-gray-600">
          אין דירה משויכת לפרופיל — לא ניתן לפתוח קריאה.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white px-4 pt-4"
      keyboardShouldPersistTaps="handled"
    >
      {buildings.length > 1 ? (
        <View className="mb-4">
          <Text className="mb-2 font-semibold text-slate-900">בניין</Text>
          <View className="gap-2">
            {buildings.map((b) => (
              <Pressable
                key={b.buildingId}
                onPress={() => setBuildingId(b.buildingId)}
                className={`rounded-lg border px-3 py-2 ${
                  buildingId === b.buildingId
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <Text>{b.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <Text className="mb-2 font-semibold text-slate-900">קטגוריה</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <View className="flex-row flex-wrap gap-2">
          {categories.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              className={`rounded-full border px-3 py-1.5 ${
                category === c
                  ? "border-blue-600 bg-blue-600"
                  : "border-slate-300 bg-white"
              }`}
            >
              <Text
                className={`text-sm ${
                  category === c ? "font-medium text-white" : "text-slate-800"
                }`}
              >
                {REQUEST_CATEGORY_LABEL[c]}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Text className="mb-2 font-semibold text-slate-900">כותרת</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        className="mb-4 rounded-lg border border-slate-300 px-3 py-2 text-base text-right"
        placeholder="נושא הקריאה"
        textAlign="right"
      />

      <Text className="mb-2 font-semibold text-slate-900">תיאור (אופציונלי)</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        className="mb-6 min-h-[100px] rounded-lg border border-slate-300 px-3 py-2 text-base text-right"
        placeholder="פרטים נוספים"
        textAlignVertical="top"
        textAlign="right"
        multiline
      />

      <Pressable
        onPress={() => void onSubmit()}
        disabled={submitting}
        className="mb-10 items-center rounded-lg bg-slate-900 py-3 active:opacity-90 disabled:opacity-50"
      >
        <Text className="font-semibold text-white">
          {submitting ? "שולח…" : "פתיחת קריאה"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
