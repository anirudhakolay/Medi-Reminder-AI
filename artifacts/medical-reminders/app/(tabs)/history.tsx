import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMedications } from "@/context/MedicationContext";
import { useColors } from "@/hooks/useColors";
import { DoseRecord } from "@/types/medication";
import { AdherenceRing } from "@/components/AdherenceRing";

type Period = "7" | "14" | "30";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { doseRecords, getAdherenceStats } = useMedications();
  const [period, setPeriod] = useState<Period>("7");

  const days = parseInt(period);
  const stats = getAdherenceStats(days);

  const records = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return [...doseRecords]
      .filter((r) => r.date >= cutoffStr)
      .sort((a, b) => b.date.localeCompare(a.date) || b.scheduledTime.localeCompare(a.scheduledTime));
  }, [doseRecords, period]);

  const grouped = useMemo(() => {
    const map = new Map<string, DoseRecord[]>();
    for (const r of records) {
      const existing = map.get(r.date) ?? [];
      existing.push(r);
      map.set(r.date, existing);
    }
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [records]);

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  }

  function formatScheduledTime(time: string): string {
    const [h, m] = time.split(":").map(Number);
    const hour = h % 12 || 12;
    const ampm = h < 12 ? "AM" : "PM";
    return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  const statusConfig = {
    taken: { color: colors.success, icon: "check-circle" as const, label: "Taken" },
    missed: { color: colors.destructive, icon: "x-circle" as const, label: "Missed" },
    skipped: { color: colors.warning, icon: "minus-circle" as const, label: "Skipped" },
    pending: { color: colors.mutedForeground, icon: "clock" as const, label: "Pending" },
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 84 : insets.bottom + 60;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={grouped}
        keyExtractor={(item) => item.date}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { paddingTop: topPadding + 16, paddingBottom: bottomPadding + 16 },
        ]}
        ListHeaderComponent={
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>History</Text>

            <View style={styles.periodRow}>
              {(["7", "14", "30"] as Period[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.periodBtn,
                    {
                      backgroundColor: period === p ? colors.primary : colors.card,
                      borderColor: period === p ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setPeriod(p)}
                >
                  <Text
                    style={[
                      styles.periodText,
                      { color: period === p ? "#fff" : colors.mutedForeground },
                    ]}
                  >
                    {p} days
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <AdherenceRing rate={stats.rate} size={90} strokeWidth={9} label="Adherence" />
              <View style={styles.statsList}>
                <StatRow label="Taken" value={stats.taken} color={colors.success} />
                <StatRow label="Missed" value={stats.missed} color={colors.destructive} />
                <StatRow label="Skipped" value={stats.skipped} color={colors.warning} />
                <StatRow label="Total" value={stats.total} color={colors.primary} />
              </View>
            </View>

            {grouped.length > 0 && (
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>
                DOSE LOG
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.group}>
            <Text style={[styles.dateLabel, { color: colors.foreground }]}>
              {formatDate(item.date)}
            </Text>
            {item.items.map((record) => {
              const cfg = statusConfig[record.status];
              return (
                <View
                  key={record.id}
                  style={[styles.record, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={[styles.recordIcon, { backgroundColor: cfg.color + "20" }]}>
                    <Feather name={cfg.icon} size={18} color={cfg.color} />
                  </View>
                  <View style={styles.recordInfo}>
                    <Text style={[styles.recordName, { color: colors.foreground }]}>
                      {record.medicationName}
                    </Text>
                    <Text style={[styles.recordTime, { color: colors.mutedForeground }]}>
                      {formatScheduledTime(record.scheduledTime)} · {cfg.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="calendar" size={52} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No history yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Your dose history will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.statRow}>
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 20 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 16 },
  periodRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  periodBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  periodText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  statsList: { flex: 1, gap: 8 },
  statRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  statValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 10 },
  group: { marginBottom: 16 },
  dateLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  record: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  recordIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  recordInfo: { flex: 1 },
  recordName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  recordTime: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 40 },
});
