import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Medication } from "@/types/medication";
import { formatTime } from "@/utils/notifications";
import { useColors } from "@/hooks/useColors";

interface Props {
  medication: Medication;
  onDelete?: (id: string) => void;
}

export function MedicationCard({ medication, onDelete }: Props) {
  const colors = useColors();

  const frequencyLabel: Record<string, string> = {
    daily: "Once daily",
    twice_daily: "Twice daily",
    three_times_daily: "3x daily",
    four_times_daily: "4x daily",
    weekly: "Weekly",
    as_needed: "As needed",
    custom: "Custom",
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.mainArea}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.selectionAsync();
          router.push(`/medication/${medication.id}`);
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.colorBar, { backgroundColor: medication.color }]} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
              {medication.name}
            </Text>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: medication.active
                    ? colors.secondary
                    : colors.muted,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: medication.active
                      ? colors.primary
                      : colors.mutedForeground,
                  },
                ]}
              >
                {medication.active ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>

          <Text style={[styles.dosage, { color: colors.mutedForeground }]}>
            {medication.dosage} {medication.unit} · {frequencyLabel[medication.frequency]}
          </Text>

          <View style={styles.timesRow}>
            {medication.times.slice(0, 3).map((t, i) => (
              <View
                key={i}
                style={[styles.timeChip, { backgroundColor: colors.secondary }]}
              >
                <Text style={[styles.timeChipIcon, { color: colors.primary }]}>🕐</Text>
                <Text style={[styles.timeText, { color: colors.primary }]}>
                  {formatTime(t.hour, t.minute)}
                </Text>
              </View>
            ))}
            {medication.times.length > 3 && (
              <Text style={[styles.moreText, { color: colors.mutedForeground }]}>
                +{medication.times.length - 3} more
              </Text>
            )}
          </View>

          {medication.withFood && (
            <View style={styles.foodRow}>
              <Text style={styles.foodIcon}>☕</Text>
              <Text style={[styles.foodText, { color: colors.mutedForeground }]}>
                Take with food
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.deleteBtn, { borderColor: colors.border }]}
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onDelete?.(medication.id);
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.deleteEmoji}>🗑️</Text>
        <Text style={styles.deleteLabel}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  mainArea: {
    flexDirection: "row",
  },
  colorBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  dosage: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  timesRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 2,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeChipIcon: {
    fontSize: 10,
  },
  timeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  moreText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    alignSelf: "center",
  },
  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  foodIcon: {
    fontSize: 12,
  },
  foodText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
  },
  deleteEmoji: {
    fontSize: 14,
  },
  deleteLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#e74c3c",
  },
});
