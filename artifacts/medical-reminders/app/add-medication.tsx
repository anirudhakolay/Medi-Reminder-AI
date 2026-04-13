import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMedications } from "@/context/MedicationContext";
import { useColors } from "@/hooks/useColors";
import { FrequencyType, Medication, MedicationTime } from "@/types/medication";
import { requestNotificationPermissions } from "@/utils/notifications";

const MEDICATION_COLORS = [
  "#0077b6",
  "#2ecc71",
  "#e74c3c",
  "#f39c12",
  "#9b59b6",
  "#1abc9c",
  "#e67e22",
  "#3498db",
];

const FREQUENCY_OPTIONS: { value: FrequencyType; label: string; defaultTimes: MedicationTime[] }[] = [
  { value: "daily", label: "Once daily", defaultTimes: [{ hour: 8, minute: 0, label: "Morning" }] },
  {
    value: "twice_daily",
    label: "Twice daily",
    defaultTimes: [
      { hour: 8, minute: 0, label: "Morning" },
      { hour: 20, minute: 0, label: "Evening" },
    ],
  },
  {
    value: "three_times_daily",
    label: "Three times daily",
    defaultTimes: [
      { hour: 8, minute: 0, label: "Morning" },
      { hour: 14, minute: 0, label: "Afternoon" },
      { hour: 20, minute: 0, label: "Evening" },
    ],
  },
  {
    value: "four_times_daily",
    label: "Four times daily",
    defaultTimes: [
      { hour: 8, minute: 0 },
      { hour: 12, minute: 0 },
      { hour: 17, minute: 0 },
      { hour: 21, minute: 0 },
    ],
  },
  { value: "weekly", label: "Weekly", defaultTimes: [{ hour: 9, minute: 0 }] },
  { value: "as_needed", label: "As needed", defaultTimes: [] },
];

const UNITS = ["mg", "mcg", "g", "ml", "tablet(s)", "capsule(s)", "drop(s)", "unit(s)"];

export default function AddMedicationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addMedication } = useMedications();

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [unit, setUnit] = useState("mg");
  const [frequency, setFrequency] = useState<FrequencyType>("daily");
  const [times, setTimes] = useState<MedicationTime[]>([{ hour: 8, minute: 0, label: "Morning" }]);
  const [withFood, setWithFood] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [color, setColor] = useState(MEDICATION_COLORS[0]);
  const [saving, setSaving] = useState(false);

  function handleFrequencyChange(freq: FrequencyType) {
    setFrequency(freq);
    const opt = FREQUENCY_OPTIONS.find((o) => o.value === freq);
    if (opt) setTimes(opt.defaultTimes);
  }

  function updateTime(index: number, field: "hour" | "minute", value: number) {
    const updated = [...times];
    updated[index] = { ...updated[index], [field]: value };
    setTimes(updated);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Missing Info", "Please enter a medication name.");
      return;
    }
    if (!dosage.trim()) {
      Alert.alert("Missing Info", "Please enter a dosage amount.");
      return;
    }

    setSaving(true);
    try {
      await requestNotificationPermissions();

      const med: Medication = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        dosage: dosage.trim(),
        unit,
        frequency,
        times,
        startDate: new Date().toISOString().split("T")[0],
        instructions: instructions.trim() || undefined,
        color,
        withFood,
        active: true,
        createdAt: new Date().toISOString(),
      };

      await addMedication(med);

      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to save medication. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.header,
          { paddingTop: topPadding + 8, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ fontSize: 22, color: colors.foreground }}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add Medication</Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: saving ? colors.muted : colors.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Section title="Color Label">
          <View style={styles.colorRow}>
            {MEDICATION_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  color === c && styles.colorDotSelected,
                ]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
        </Section>

        <Section title="Medication Name">
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="e.g. Metformin, Aspirin..."
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </Section>

        <Section title="Dosage">
          <View style={styles.dosageRow}>
            <TextInput
              style={[styles.input, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. 500"
              placeholderTextColor={colors.mutedForeground}
              value={dosage}
              onChangeText={setDosage}
              keyboardType="decimal-pad"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
              {UNITS.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.unitBtn,
                    {
                      backgroundColor: unit === u ? colors.primary : colors.card,
                      borderColor: unit === u ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setUnit(u)}
                >
                  <Text style={[styles.unitText, { color: unit === u ? "#fff" : colors.mutedForeground }]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Section>

        <Section title="Frequency">
          <View style={styles.optionsList}>
            {FREQUENCY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.optionBtn,
                  {
                    backgroundColor: frequency === opt.value ? colors.secondary : colors.card,
                    borderColor: frequency === opt.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleFrequencyChange(opt.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: frequency === opt.value ? colors.primary : colors.foreground },
                  ]}
                >
                  {opt.label}
                </Text>
                {frequency === opt.value && (
                  <Text style={{ fontSize: 16, color: colors.primary, fontFamily: "Inter_700Bold" }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {times.length > 0 && (
          <Section title="Reminder Times">
            {times.map((time, i) => (
              <View key={i} style={[styles.timeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.timeColorDot, { backgroundColor: color }]} />
                <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>
                  {time.label ?? `Dose ${i + 1}`}
                </Text>
                <View style={styles.timePickerRow}>
                  {/* Hour column */}
                  <View style={styles.timeColumn}>
                    <TouchableOpacity
                      style={[styles.timeAdjBtn, { backgroundColor: colors.primary }]}
                      onPress={() => updateTime(i, "hour", (time.hour - 1 + 24) % 24)}
                    >
                      <Text style={styles.timeAdjText}>+</Text>
                    </TouchableOpacity>
                    <Text style={[styles.timeValue, { color: colors.foreground }]}>
                      {String(time.hour % 12 || 12).padStart(2, "0")}
                    </Text>
                    <TouchableOpacity
                      style={[styles.timeAdjBtn, { backgroundColor: colors.muted }]}
                      onPress={() => updateTime(i, "hour", (time.hour + 1) % 24)}
                    >
                      <Text style={[styles.timeAdjText, { color: colors.foreground }]}>−</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.timeSep, { color: colors.foreground }]}>:</Text>

                  {/* Minute column */}
                  <View style={styles.timeColumn}>
                    <TouchableOpacity
                      style={[styles.timeAdjBtn, { backgroundColor: colors.primary }]}
                      onPress={() => updateTime(i, "minute", (time.minute - 5 + 60) % 60)}
                    >
                      <Text style={styles.timeAdjText}>+</Text>
                    </TouchableOpacity>
                    <Text style={[styles.timeValue, { color: colors.foreground }]}>
                      {String(time.minute).padStart(2, "0")}
                    </Text>
                    <TouchableOpacity
                      style={[styles.timeAdjBtn, { backgroundColor: colors.muted }]}
                      onPress={() => updateTime(i, "minute", (time.minute + 5) % 60)}
                    >
                      <Text style={[styles.timeAdjText, { color: colors.foreground }]}>−</Text>
                    </TouchableOpacity>
                  </View>

                  {/* AM/PM toggle */}
                  <TouchableOpacity
                    style={[styles.ampmBtn, { backgroundColor: colors.primary }]}
                    onPress={() => updateTime(i, "hour", time.hour < 12 ? time.hour + 12 : time.hour - 12)}
                  >
                    <Text style={styles.ampmText}>{time.hour < 12 ? "AM" : "PM"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </Section>
        )}

        <Section title="Options">
          <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.toggleInfo}>
              <Text style={{ fontSize: 16 }}>☕</Text>
              <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Take with food</Text>
            </View>
            <Switch
              value={withFood}
              onValueChange={setWithFood}
              trackColor={{ false: colors.border, true: colors.primary + "80" }}
              thumbColor={withFood ? colors.primary : colors.mutedForeground}
            />
          </View>
        </Section>

        <Section title="Notes (optional)">
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="Additional instructions..."
            placeholderTextColor={colors.mutedForeground}
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={3}
          />
        </Section>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  saveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 10 },
  colorRow: { flexDirection: "row", gap: 10 },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textArea: { height: 88, textAlignVertical: "top", paddingTop: 12 },
  dosageRow: { gap: 10 },
  unitScroll: { flexGrow: 0 },
  unitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  unitText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  optionsList: { gap: 8 },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  timeColorDot: { width: 10, height: 10, borderRadius: 5 },
  timeLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  timePickerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  timeColumn: { alignItems: "center", gap: 4 },
  timeAdjBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  timeAdjText: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold", lineHeight: 22 },
  timeValue: { fontSize: 22, fontFamily: "Inter_700Bold", minWidth: 34, textAlign: "center" },
  timeSep: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 4 },
  ampmBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, alignItems: "center", justifyContent: "center", marginLeft: 2 },
  ampmText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  ampm: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginLeft: 4 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  toggleLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
