import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMedications } from "@/context/MedicationContext";
import { useColors } from "@/hooks/useColors";
import { AICoachResponse, AIInsight, getAICoachInsights } from "@/utils/aiCoach";

export default function CoachScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { medications, doseRecords, getAdherenceStats } = useMedications();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AICoachResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = getAdherenceStats(7);

  async function handleGetInsights() {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const result = await getAICoachInsights(
        medications,
        doseRecords,
        stats.rate
      );
      setResponse(result);
    } catch (e) {
      setError("Could not get insights right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const insightConfig: Record<AIInsight["type"], { icon: string; color: string; bg: string }> = {
    tip: { icon: "lightbulb", color: colors.primary, bg: colors.secondary },
    warning: { icon: "alert-triangle", color: colors.warning, bg: colors.warning + "20" },
    achievement: { icon: "award", color: colors.success, bg: colors.success + "20" },
    suggestion: { icon: "message-circle", color: colors.accent, bg: colors.accent + "20" },
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 84 : insets.bottom + 60;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPadding + 16, paddingBottom: bottomPadding + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>AI Coach</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Personalized insights powered by AI
        </Text>

        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <View style={styles.heroIcon}>
            <Feather name="cpu" size={32} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={styles.heroTitle}>Your Adherence Coach</Text>
          <Text style={styles.heroText}>
            Get personalized analysis of your medication adherence patterns, smart reminders,
            and actionable tips to help you stay on track.
          </Text>

          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{stats.rate}%</Text>
              <Text style={styles.quickStatLabel}>7-day rate</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{stats.taken}</Text>
              <Text style={styles.quickStatLabel}>Doses taken</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStat}>
              <Text style={styles.quickStatValue}>{stats.missed}</Text>
              <Text style={styles.quickStatLabel}>Missed</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.analyzeBtn}
            onPress={handleGetInsights}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <>
                <Feather name="zap" size={16} color={colors.primary} />
                <Text style={[styles.analyzeBtnText, { color: colors.primary }]}>
                  Analyze My Adherence
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Analyzing your medication patterns...
            </Text>
          </View>
        )}

        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "40" }]}>
            <Feather name="alert-circle" size={20} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            <TouchableOpacity onPress={handleGetInsights}>
              <Text style={[styles.retryText, { color: colors.primary }]}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {response && (
          <View style={styles.results}>
            <View style={[styles.overallCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.overallLabel, { color: colors.mutedForeground }]}>
                COACH'S ASSESSMENT
              </Text>
              <Text style={[styles.overallMessage, { color: colors.foreground }]}>
                {response.overallMessage}
              </Text>
            </View>

            <Text style={[styles.insightsLabel, { color: colors.mutedForeground }]}>
              INSIGHTS & RECOMMENDATIONS
            </Text>

            {response.insights.map((insight, i) => {
              const cfg = insightConfig[insight.type] ?? insightConfig.tip;
              return (
                <View
                  key={i}
                  style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={[styles.insightIcon, { backgroundColor: cfg.bg }]}>
                    <Feather name={cfg.icon as any} size={20} color={cfg.color} />
                  </View>
                  <View style={styles.insightContent}>
                    <Text style={[styles.insightTitle, { color: colors.foreground }]}>
                      {insight.title}
                    </Text>
                    <Text style={[styles.insightMessage, { color: colors.mutedForeground }]}>
                      {insight.message}
                    </Text>
                  </View>
                </View>
              );
            })}

            <TouchableOpacity
              style={[styles.refreshBtn, { borderColor: colors.border }]}
              onPress={handleGetInsights}
            >
              <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
              <Text style={[styles.refreshText, { color: colors.mutedForeground }]}>
                Refresh insights
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!response && !loading && !error && (
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>
              What your AI Coach can do
            </Text>
            <InfoItem
              icon="trending-up"
              text="Analyze your adherence patterns over time"
              colors={colors}
            />
            <InfoItem
              icon="alert-triangle"
              text="Identify which medications you tend to miss"
              colors={colors}
            />
            <InfoItem
              icon="clock"
              text="Suggest better reminder times based on your history"
              colors={colors}
            />
            <InfoItem
              icon="heart"
              text="Provide encouragement and actionable tips"
              colors={colors}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function InfoItem({ icon, text, colors }: { icon: string; text: string; colors: any }) {
  return (
    <View style={styles.infoItem}>
      <View style={[styles.infoIconWrap, { backgroundColor: colors.secondary }]}>
        <Feather name={icon as any} size={16} color={colors.primary} />
      </View>
      <Text style={[styles.infoItemText, { color: colors.mutedForeground }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 20 },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    gap: 12,
  },
  heroIcon: { marginBottom: 4 },
  heroTitle: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  heroText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  quickStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    padding: 16,
    marginVertical: 4,
    alignItems: "center",
  },
  quickStat: { flex: 1, alignItems: "center" },
  quickStatValue: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  quickStatLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  quickStatDivider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.25)" },
  analyzeBtn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  analyzeBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  errorCard: {
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  retryText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  results: { gap: 12 },
  overallCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  overallLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  overallMessage: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  insightsLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  insightCard: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  insightContent: { flex: 1, gap: 4 },
  insightTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  insightMessage: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  refreshText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  infoCard: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
    marginTop: 4,
  },
  infoTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  infoItemText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
});
