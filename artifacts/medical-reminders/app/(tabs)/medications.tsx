import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MedicationCard } from "@/components/MedicationCard";
import { useMedications } from "@/context/MedicationContext";
import { useColors } from "@/hooks/useColors";

export default function MedicationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { medications, deleteMedication } = useMedications();
  const [search, setSearch] = useState("");

  const filtered = medications.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );
  const active = filtered.filter((m) => m.active);
  const inactive = filtered.filter((m) => !m.active);

  function handleDelete(id: string) {
    Alert.alert(
      "Delete Medication",
      "Are you sure you want to delete this medication? All reminders will be cancelled.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await deleteMedication(id);
          },
        },
      ]
    );
  }

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 84 : insets.bottom + 60;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.headerBar,
          { paddingTop: topPadding + 16, backgroundColor: colors.background },
        ]}
      >
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Medications
          </Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/add-medication")}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search medications..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={[...active, ...inactive]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomPadding + 16 },
        ]}
        ListHeaderComponent={
          filtered.length === 0 ? null : (
            <View>
              {active.length > 0 && (
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                  ACTIVE ({active.length})
                </Text>
              )}
            </View>
          )
        }
        renderItem={({ item, index }) => {
          const isFirstInactive =
            active.length > 0 && index === active.length;
          return (
            <>
              {isFirstInactive && (
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 12 }]}>
                  INACTIVE ({inactive.length})
                </Text>
              )}
              <MedicationCard
                medication={item}
                onDelete={handleDelete}
              />
            </>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="activity" size={52} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {search ? "No results found" : "No medications yet"}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {search
                ? "Try a different search term"
                : "Add your first medication to start tracking"}
            </Text>
            {!search && (
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/add-medication")}
              >
                <Text style={styles.emptyBtnText}>Add Medication</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 10,
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
