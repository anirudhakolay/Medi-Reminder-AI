import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DoseCard } from "@/components/DoseCard";
import { useMedications } from "@/context/MedicationContext";
import { useColors } from "@/hooks/useColors";
import { TodayDose } from "@/types/medication";

export default function TodayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { todayDoses, isLoading, refreshTodayDoses, getAdherenceStats } =
    useMedications();

  const stats = getAdherenceStats(1);
  const totalToday = todayDoses.length;
  const takenToday = todayDoses.filter((d) => d.status === "taken").length;
  const upcomingDoses = todayDoses.filter(
    (d) => d.status === "pending" && d.scheduledDateTime > new Date()
  );
  const overdueDoses = todayDoses.filter(
    (d) => d.status === "missed" || (d.status === "pending" && d.scheduledDateTime <= new Date())
  );
  const completedDoses = todayDoses.filter(
    (d) => d.status === "taken" || d.status === "skipped"
  );

  const onRefresh = useCallback(() => {
    refreshTodayDoses();
  }, [refreshTodayDoses]);

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 84 : insets.bottom + 60;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPadding + 16, paddingBottom: bottomPadding + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              {greeting}
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Today's Reminders
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/add-medication")}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={[styles.notifBanner, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Text style={{ fontSize: 14 }}>🔔</Text>
          <Text style={[styles.notifBannerText, { color: colors.mutedForeground }]}>
            Notifications require a development build — not supported in Expo Go on Android.
          </Text>
        </View>

        {totalToday > 0 && (
          <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressTitle, { color: colors.foreground }]}>
                {takenToday} of {totalToday} doses taken
              </Text>
              <Text style={[styles.progressSub, { color: colors.mutedForeground }]}>
                {totalToday - takenToday > 0
                  ? `${totalToday - takenToday} remaining`
                  : "All done for today!"}
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: totalToday > 0 ? `${(takenToday / totalToday) * 100}%` : "0%",
                  },
                ]}
              />
            </View>
          </View>
        )}

        {overdueDoses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: colors.destructive }]} />
              <Text style={[styles.sectionTitle, { color: colors.destructive }]}>
                Overdue ({overdueDoses.length})
              </Text>
            </View>
            {overdueDoses.map((dose, i) => (
              <DoseCard key={`${dose.medication.id}-${i}`} dose={dose} />
            ))}
          </View>
        )}

        {upcomingDoses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Upcoming ({upcomingDoses.length})
              </Text>
            </View>
            {upcomingDoses.map((dose, i) => (
              <DoseCard key={`${dose.medication.id}-${i}`} dose={dose} />
            ))}
          </View>
        )}

        {completedDoses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                Completed ({completedDoses.length})
              </Text>
            </View>
            {completedDoses.map((dose, i) => (
              <DoseCard key={`${dose.medication.id}-${i}`} dose={dose} />
            ))}
          </View>
        )}

        {totalToday === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Feather name="check-circle" size={56} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No medications today
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Add your first medication to get started
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/add-medication")}
            >
              <Text style={styles.emptyBtnText}>Add Medication</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  notifBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 16,
  },
  notifBannerText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular" },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0077b6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  progressCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  progressInfo: { gap: 2 },
  progressTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  progressSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  section: { marginBottom: 4 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
