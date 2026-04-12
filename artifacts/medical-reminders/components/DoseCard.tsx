
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TodayDose } from "@/types/medication";
import { formatTime } from "@/utils/notifications";
import { useColors } from "@/hooks/useColors";
import { useMedications } from "@/context/MedicationContext";

interface Props {
  dose: TodayDose;
}

export function DoseCard({ dose }: Props) {
  const colors = useColors();
  const { recordDose } = useMedications();
  const [loading, setLoading] = useState(false);

  const timeStr = `${String(dose.time.hour).padStart(2, "0")}:${String(dose.time.minute).padStart(2, "0")}`;
  const isUpcoming = dose.scheduledDateTime > new Date();
  const isTaken = dose.status === "taken";
  const isSkipped = dose.status === "skipped";

  async function handleMark(status: "taken" | "skipped") {
    if (loading) return;
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setLoading(true);
    try {
      await recordDose(dose.medication.id, timeStr, status);
    } finally {
      setLoading(false);
    }
  }

  const statusColor =
    isTaken
      ? colors.success
      : isSkipped
      ? colors.warning
      : dose.status === "missed"
      ? colors.destructive
      : isUpcoming
      ? colors.primary
      : colors.mutedForeground;

  const statusLabel =
    isTaken
      ? "Taken"
      : isSkipped
      ? "Skipped"
      : dose.status === "missed"
      ? "Missed"
      : isUpcoming
      ? "Upcoming"
      : "Pending";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: isTaken || isSkipped ? 0.75 : 1,
        },
      ]}
    >
      <View style={[styles.leftBar, { backgroundColor: dose.medication.color }]} />

      <View style={styles.content}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={[styles.medName, { color: colors.foreground }]} numberOfLines={1}>
              {dose.medication.name}
            </Text>
            <Text style={[styles.dosage, { color: colors.mutedForeground }]}>
              {dose.medication.dosage} {dose.medication.unit}
              {dose.medication.withFood ? " · with food" : ""}
            </Text>
          </View>

          <View style={styles.timeStatus}>
            <Text style={[styles.time, { color: colors.foreground }]}>
              {formatTime(dose.time.hour, dose.time.minute)}
            </Text>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {!isTaken && !isSkipped && (
          <View style={styles.actions}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.btn, styles.takeBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleMark("taken")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnIcon}>✓</Text>
                  <Text style={styles.btnText}>Take</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.skipBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                  onPress={() => handleMark("skipped")}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.skipBtnIcon, { color: colors.mutedForeground }]}>✕</Text>
                  <Text style={[styles.skipBtnText, { color: colors.mutedForeground }]}>Skip</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {(isTaken || isSkipped) && (
          <TouchableOpacity
            style={styles.undoBtn}
            onPress={() => handleMark(isTaken ? "skipped" : "taken")}
          >
            <Text style={[styles.undoText, { color: colors.mutedForeground }]}>
              ↩ Mark as {isTaken ? "skipped" : "taken"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  leftBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  medName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  dosage: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  timeStatus: {
    alignItems: "flex-end",
    gap: 5,
  },
  time: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  statusDot: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
  },
  takeBtn: {},
  skipBtn: {
    borderWidth: 1,
  },
  btnIcon: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  btnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  skipBtnIcon: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  skipBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  undoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  undoText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
