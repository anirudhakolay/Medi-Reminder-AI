import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMedications } from "@/context/MedicationContext";
import { useColors } from "@/hooks/useColors";
import { formatTime } from "@/utils/notifications";

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { medications, updateMedication, deleteMedication } = useMedications();

  const medication = medications.find((m) => m.id === id);

  if (!medication) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>Medication not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const frequencyLabel: Record<string, string> = {
    daily: "Once daily",
    twice_daily: "Twice daily",
    three_times_daily: "3x daily",
    four_times_daily: "4x daily",
    weekly: "Weekly",
    as_needed: "As needed",
    custom: "Custom",
  };

  async function handleToggleActive() {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await updateMedication({ ...medication, active: !medication.active });
  }

  async function handleDelete() {
    Alert.alert(
      "Delete Medication",
      `Delete "${medication.name}"? All reminders will be cancelled.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteMedication(medication.id);
            router.back();
          },
        },
      ]
    );
  }

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPadding + 8, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {medication.name}
        </Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Feather name="trash-2" size={20} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.colorBanner, { backgroundColor: medication.color }]}>
          <Text style={styles.bannerName}>{medication.name}</Text>
          <Text style={styles.bannerDosage}>
            {medication.dosage} {medication.unit}
          </Text>
        </View>

        <InfoCard colors={colors} title="Frequency">
          <Text style={[styles.infoValue, { color: colors.foreground }]}>
            {frequencyLabel[medication.frequency]}
          </Text>
        </InfoCard>

        {medication.times.length > 0 && (
          <InfoCard colors={colors} title="Reminder Times">
            <View style={styles.timesGrid}>
              {medication.times.map((t, i) => (
                <View key={i} style={[styles.timeChip, { backgroundColor: colors.secondary }]}>
                  <Feather name="clock" size={13} color={colors.primary} />
                  <Text style={[styles.timeChipText, { color: colors.primary }]}>
                    {formatTime(t.hour, t.minute)}
                  </Text>
                </View>
              ))}
            </View>
          </InfoCard>
        )}

        <InfoCard colors={colors} title="Options">
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Feather name="coffee" size={16} color={colors.mutedForeground} />
              <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Take with food</Text>
            </View>
            <Text style={[styles.infoValue, { color: medication.withFood ? colors.primary : colors.mutedForeground }]}>
              {medication.withFood ? "Yes" : "No"}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Feather name="bell" size={16} color={colors.mutedForeground} />
              <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Active reminders</Text>
            </View>
            <Switch
              value={medication.active}
              onValueChange={handleToggleActive}
              trackColor={{ false: colors.border, true: colors.primary + "80" }}
              thumbColor={medication.active ? colors.primary : colors.mutedForeground}
            />
          </View>
        </InfoCard>

        {medication.instructions && (
          <InfoCard colors={colors} title="Notes">
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              {medication.instructions}
            </Text>
          </InfoCard>
        )}

        <InfoCard colors={colors} title="Schedule">
          <Text style={[styles.infoValue, { color: colors.foreground }]}>
            Started: {new Date(medication.startDate + "T00:00:00").toLocaleDateString()}
          </Text>
          {medication.endDate && (
            <Text style={[styles.infoValue, { color: colors.mutedForeground }]}>
              Ends: {new Date(medication.endDate + "T00:00:00").toLocaleDateString()}
            </Text>
          )}
        </InfoCard>
      </ScrollView>
    </View>
  );
}

function InfoCard({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "center" },
  deleteBtn: { padding: 4 },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 12 },
  colorBanner: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 4,
    gap: 4,
  },
  bannerName: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  bannerDosage: { color: "rgba(255,255,255,0.85)", fontSize: 15, fontFamily: "Inter_400Regular" },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  infoLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 4 },
  infoValue: { fontSize: 14, fontFamily: "Inter_400Regular" },
  timesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  timeChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  toggleLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  divider: { height: 1, marginVertical: 4 },
});
