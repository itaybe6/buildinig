import { ANNOUNCEMENT_AUDIENCE_LABEL } from "@my-project/shared";
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

type AudienceKey = keyof typeof ANNOUNCEMENT_AUDIENCE_LABEL;

export default function NewAnnouncementScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState<ResidentBuildingOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [audience, setAudience] = useState<AudienceKey>("residents");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

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
    const b = body.trim();
    if (!t || !b) {
      Alert.alert("חסר נתון", "נא למלא כותרת ותוכן.");
      return;
    }
    if (!buildingId) {
      Alert.alert("חסר נתון", "אין בניין משויך לפרופיל.");
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
    const { error } = await supabase.from("announcements").insert({
      building_id: buildingId,
      created_by: profile.id,
      title: t,
      body: b,
      audience,
      is_pinned: false,
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
          אין דירה משויכת לפרופיל — לא ניתן לפרסם מודעה.
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
            {buildings.map((x) => (
              <Pressable
                key={x.buildingId}
                onPress={() => setBuildingId(x.buildingId)}
                className={`rounded-lg border px-3 py-2 ${
                  buildingId === x.buildingId
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <Text>{x.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <Text className="mb-2 font-semibold text-slate-900">קהל יעד</Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {(["residents", "all"] as const).map((key) => (
          <Pressable
            key={key}
            onPress={() => setAudience(key)}
            className={`rounded-full border px-3 py-1.5 ${
              audience === key
                ? "border-blue-600 bg-blue-600"
                : "border-slate-300 bg-white"
            }`}
          >
            <Text
              className={`text-sm ${
                audience === key ? "font-medium text-white" : "text-slate-800"
              }`}
            >
              {ANNOUNCEMENT_AUDIENCE_LABEL[key]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="mb-2 font-semibold text-slate-900">כותרת</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        className="mb-4 rounded-lg border border-slate-300 px-3 py-2 text-base text-right"
        placeholder="כותרת המודעה"
        textAlign="right"
      />

      <Text className="mb-2 font-semibold text-slate-900">תוכן</Text>
      <TextInput
        value={body}
        onChangeText={setBody}
        className="mb-6 min-h-[120px] rounded-lg border border-slate-300 px-3 py-2 text-base text-right"
        placeholder="תוכן ההודעה לדיירים"
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
          {submitting ? "שולח…" : "פרסום מודעה"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
