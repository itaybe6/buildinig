import {
  formatILS,
  QUOTE_STATUS_LABEL,
  validateResidentProposedAmount,
} from "@my-project/shared";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { resolveTenantScopeForUser } from "@/lib/tenant-context";
import { uploadResidentHubImage } from "@/lib/upload-resident-hub-media";
import { supabase } from "@/lib/supabase";

const MAX_IMAGES = 4;

type BuildingOpt = {
  buildingId: string;
  unitId: string;
  label: string;
};

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  price_min: string | null;
  price_max: string | null;
};

type QuoteRow = {
  id: string;
  title: string;
  status: string;
  created_at: string | null;
};

function formatPriceRange(
  priceMin: string | null,
  priceMax: string | null
): string {
  const lo = priceMin != null && priceMin !== "" ? Number(priceMin) : null;
  const hi = priceMax != null && priceMax !== "" ? Number(priceMax) : null;
  const loOk = lo != null && Number.isFinite(lo);
  const hiOk = hi != null && Number.isFinite(hi);
  if (loOk && hiOk) return `${formatILS(lo)} – ${formatILS(hi)}`;
  if (loOk) return `מ-${formatILS(lo)}`;
  if (hiOk) return `עד ${formatILS(hi)}`;
  return "כל מחיר חיובי";
}

function priceInputHint(
  priceMin: string | null,
  priceMax: string | null
): string {
  const lo =
    priceMin != null && priceMin !== "" ? Number(priceMin) : null;
  const hi =
    priceMax != null && priceMax !== "" ? Number(priceMax) : null;
  const loOk = lo != null && Number.isFinite(lo);
  const hiOk = hi != null && Number.isFinite(hi);
  if (loOk && hiOk) {
    return `יש להזין סכום בין ${formatILS(lo)} ל-${formatILS(hi)} (כולל הקצוות).`;
  }
  if (loOk) {
    return `יש להזין סכום של לפחות ${formatILS(lo)}.`;
  }
  if (hiOk) {
    return `יש להזין סכום של עד ${formatILS(hi)}.`;
  }
  return "יש להזין מחיר חיובי.";
}

async function loadBuildingOptions(
  profileId: string,
  businessProfileId: string
): Promise<BuildingOpt[]> {
  const { data, error } = await supabase
    .from("units")
    .select(
      "id, building_id, buildings!inner ( address, city, business_profile_id )"
    )
    .eq("resident_profile_id", profileId)
    .eq("buildings.business_profile_id", businessProfileId);

  if (error || !data?.length) return [];

  const byBuilding = new Map<string, BuildingOpt>();
  for (const row of data) {
    const b = row.buildings as unknown as { address: string; city: string };
    const label =
      [b.address, b.city].filter(Boolean).join(", ") || "בניין";
    if (!byBuilding.has(row.building_id)) {
      byBuilding.set(row.building_id, {
        unitId: row.id,
        buildingId: row.building_id,
        label,
      });
    }
  }
  return Array.from(byBuilding.values());
}

export default function ResidentQuotesListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [businessProfileId, setBusinessProfileId] = useState<string | null>(
    null
  );
  const [profileId, setProfileId] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<BuildingOpt[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [rows, setRows] = useState<QuoteRow[]>([]);

  const [modalService, setModalService] = useState<ServiceRow | null>(null);
  const [buildingId, setBuildingId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [amountText, setAmountText] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
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

    const { businessProfileId: bp } = await resolveTenantScopeForUser(
      supabase,
      user.id
    );
    if (!bp) return;

    const { data: qr } = await supabase
      .from("quote_requests")
      .select("id, title, status, created_at")
      .eq("business_profile_id", bp)
      .eq("requested_by", profile.id)
      .order("created_at", { ascending: false })
      .limit(80);

    setRows(qr ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setErr("לא מחובר");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (!profile) {
          setErr("לא נמצא פרופיל");
          return;
        }

        const { tenantId, businessProfileId: bp } =
          await resolveTenantScopeForUser(supabase, user.id);
        if (!tenantId) {
          setErr("חסר מזהה ארגון");
          return;
        }

        if (!bp) {
          setErr("חסר פרופיל עסק — צור business_profiles לארגון");
          return;
        }

        const [bOpts, svcRes, qrRes] = await Promise.all([
          loadBuildingOptions(profile.id, bp),
          supabase
            .from("service_types")
            .select("id, name, description, price_min, price_max")
            .eq("business_profile_id", bp)
            .eq("is_active", true)
            .order("name", { ascending: true }),
          supabase
            .from("quote_requests")
            .select("id, title, status, created_at")
            .eq("business_profile_id", bp)
            .eq("requested_by", profile.id)
            .order("created_at", { ascending: false })
            .limit(80),
        ]);

        if (cancelled) return;
        setProfileId(profile.id);
        setBusinessProfileId(bp);
        setBuildings(bOpts);
        setServices(svcRes.data ?? []);
        setRows(qrRes.data ?? []);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "שגיאה");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (buildings.length && !buildingId) {
      setBuildingId(buildings[0].buildingId);
    }
  }, [buildings, buildingId]);

  const closeModal = useCallback(() => {
    setModalService(null);
    setDescription("");
    setAmountText("");
    setAmountError(null);
    setImageUris([]);
    setSubmitting(false);
  }, []);

  const pickImages = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("הרשאה", "נדרשת גישה לגלריה.");
      return;
    }
    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (pick.canceled || !pick.assets?.length) return;
    const uris = pick.assets.map((a) => a.uri).filter(Boolean);
    setImageUris((prev) => [...prev, ...uris].slice(0, MAX_IMAGES));
  }, []);

  const removeImageAt = useCallback((index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const onSubmitQuote = useCallback(async () => {
    if (!modalService || !businessProfileId || !profileId) return;
    const desc = description.trim();
    if (!desc) {
      Alert.alert("חסר", "נא למלא תיאור לבקשה.");
      return;
    }
    const building = buildings.find((b) => b.buildingId === buildingId);
    if (!building) {
      Alert.alert("שגיאה", "נא לבחור בניין.");
      return;
    }

    const proposed = Number(amountText.trim().replace(",", "."));
    const bounds = validateResidentProposedAmount(proposed, {
      priceMin: modalService.price_min,
      priceMax: modalService.price_max,
    });
    if (!bounds.ok) {
      setAmountError(bounds.message);
      return;
    }
    setAmountError(null);

    setSubmitting(true);
    try {
      const imageUrls: string[] = [];
      for (const uri of imageUris) {
        const manipulated = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1600 } }],
          { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG }
        );
        const response = await fetch(manipulated.uri);
        const blob = await response.blob();
        const up = await uploadResidentHubImage(supabase, {
          businessProfileId,
          buildingId: building.buildingId,
          blob,
          contentType: "image/jpeg",
        });
        if (!up.ok) {
          Alert.alert("העלאה", up.error);
          setSubmitting(false);
          return;
        }
        imageUrls.push(up.publicUrl);
      }

      const { error } = await supabase.from("quote_requests").insert({
        business_profile_id: businessProfileId,
        building_id: building.buildingId,
        unit_id: building.unitId,
        requested_by: profileId,
        service_type_id: modalService.id,
        title: `הצעת מחיר — ${modalService.name}`,
        description: desc,
        image_urls: imageUrls.length ? imageUrls : null,
        resident_proposed_amount: proposed.toFixed(2),
        status: "pending",
      });

      if (error) {
        Alert.alert("שגיאה", error.message);
        setSubmitting(false);
        return;
      }

      await refresh();
      closeModal();
      Alert.alert("נשלח", "הבקשה נשלחה.");
    } catch (e) {
      Alert.alert("שגיאה", e instanceof Error ? e.message : "שגיאה");
    } finally {
      setSubmitting(false);
    }
  }, [
    amountText,
    buildingId,
    buildings,
    businessProfileId,
    closeModal,
    description,
    imageUris,
    modalService,
    profileId,
    refresh,
  ]);

  const buildingPicker = useMemo(() => {
    if (buildings.length <= 1) return null;
    return (
      <View className="mb-3 gap-2">
        <Text className="text-sm font-medium text-slate-700">בניין</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row flex-wrap gap-2">
            {buildings.map((b) => (
              <Pressable
                key={b.buildingId}
                onPress={() => setBuildingId(b.buildingId)}
                className={`rounded-full border px-3 py-2 ${
                  buildingId === b.buildingId
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <Text className="text-sm">{b.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }, [buildings, buildingId]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (err && !profileId) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-center text-red-600">{err}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-4">
      {err ? (
        <Text className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {err}
        </Text>
      ) : null}
      <Text className="mb-1 text-xl font-bold">שירותים</Text>
      <Text className="mb-4 text-sm text-gray-600">
        בחר שירות והגש הצעת מחיר עם תיאור, תמונות ומחיר בטווח המוצג.
      </Text>

      {buildings.length === 0 ? (
        <Text className="mb-6 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-gray-600">
          אין דירה משויכת לפרופיל — לא ניתן להגיש הצעות מחיר.
        </Text>
      ) : !services.length ? (
        <Text className="mb-6 text-gray-500">אין שירותים זמינים.</Text>
      ) : (
        <View className="mb-8 gap-3">
          {services.map((s) => (
            <View
              key={s.id}
              className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
            >
              <Text className="text-base font-semibold">{s.name}</Text>
              {s.description ? (
                <Text className="mt-1 text-sm text-gray-600">{s.description}</Text>
              ) : null}
              <Text className="mt-2 text-sm text-gray-500">
                טווח: {formatPriceRange(s.price_min, s.price_max)}
              </Text>
              <Pressable
                onPress={() => {
                  setModalService(s);
                  setDescription("");
                  setAmountText("");
                  setAmountError(null);
                  setImageUris([]);
                  if (buildings[0]) setBuildingId(buildings[0].buildingId);
                }}
                className="mt-3 self-start rounded-lg bg-slate-900 px-4 py-2 active:opacity-90"
              >
                <Text className="font-medium text-white">הגש הצעת מחיר</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Text className="mb-2 text-lg font-bold">הבקשות שלי</Text>
      {!rows.length ? (
        <Text className="pb-8 text-gray-500">אין בקשות עדיין.</Text>
      ) : (
        <View className="gap-2 pb-8">
          {rows.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => router.push(`/(resident)/quotes/${r.id}`)}
              className="rounded-lg border border-slate-200 px-3 py-3 active:bg-slate-50"
            >
              <Text className="font-semibold">{r.title}</Text>
              <Text className="text-sm text-gray-600">
                {QUOTE_STATUS_LABEL[
                  r.status as keyof typeof QUOTE_STATUS_LABEL
                ] ?? r.status}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <Modal
        visible={modalService !== null}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <Pressable
          className="flex-1 justify-end bg-black/50"
          onPress={closeModal}
        >
          <Pressable
            className="max-h-[90%] rounded-t-2xl bg-white px-4 pb-8 pt-4"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="mb-1 text-lg font-bold">
              הצעת מחיר — {modalService?.name}
            </Text>
            {modalService ? (
              <Text className="mb-4 text-sm text-gray-600">
                טווח מחיר:{" "}
                {formatPriceRange(
                  modalService.price_min,
                  modalService.price_max
                )}
              </Text>
            ) : null}

            {buildingPicker}

            <Text className="mb-1 text-sm font-medium text-slate-700">
              תיאור הבקשה
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="תאר את הבקשה..."
              className="mb-3 min-h-[100px] rounded-lg border border-slate-200 px-3 py-2 text-base"
            />

            <Text className="mb-1 text-sm font-medium text-slate-700">
              מחיר מוצע (₪)
            </Text>
            {modalService ? (
              <Text className="mb-2 text-xs leading-5 text-slate-600">
                {priceInputHint(
                  modalService.price_min,
                  modalService.price_max
                )}
              </Text>
            ) : null}
            <View className="mb-3">
              <TextInput
                value={amountText}
                onChangeText={(t) => {
                  setAmountText(t);
                  setAmountError(null);
                }}
                keyboardType="decimal-pad"
                placeholder="למשל 1500"
                className={`rounded-lg border px-3 py-2 text-base ${
                  amountError ? "border-red-500" : "border-slate-200"
                }`}
              />
              {amountError ? (
                <Text className="mt-1 text-sm text-red-600">{amountError}</Text>
              ) : null}
            </View>

            <Pressable
              onPress={pickImages}
              disabled={submitting || imageUris.length >= MAX_IMAGES}
              className="mb-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2"
            >
              <Text className="text-center font-medium text-slate-800">
                הוספת תמונות (עד {MAX_IMAGES})
              </Text>
            </Pressable>
            <Text className="mb-2 text-xs text-gray-500">
              נבחרו {imageUris.length} תמונות
            </Text>

            <View className="mb-4 flex-row flex-wrap gap-2">
              {imageUris.map((uri, i) => (
                <Pressable
                  key={`${uri}-${i}`}
                  onPress={() => removeImageAt(i)}
                  className="relative"
                >
                  <Text className="absolute right-0 top-0 z-10 rounded-full bg-red-500 px-1.5 text-xs text-white">
                    ×
                  </Text>
                  <Image
                    source={{ uri }}
                    className="h-16 w-16 rounded-md"
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={onSubmitQuote}
                disabled={submitting}
                className="flex-1 rounded-lg bg-slate-900 py-3 disabled:opacity-50"
              >
                <Text className="text-center font-semibold text-white">
                  {submitting ? "שולח…" : "שליחת בקשה"}
                </Text>
              </Pressable>
              <Pressable
                onPress={closeModal}
                disabled={submitting}
                className="rounded-lg border border-slate-300 px-4 py-3"
              >
                <Text>ביטול</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
