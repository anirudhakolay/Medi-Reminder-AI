import { DoseRecord, Medication } from "@/types/medication";

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

export interface AIInsight {
  type: "tip" | "warning" | "achievement" | "suggestion";
  title: string;
  message: string;
}

export interface AICoachResponse {
  insights: AIInsight[];
  overallMessage: string;
  adherenceScore: number;
}

export async function getAICoachInsights(
  medications: Medication[],
  doseRecords: DoseRecord[],
  adherenceRate: number,
  onChunk?: (text: string) => void
): Promise<AICoachResponse> {
  const recentRecords = doseRecords
    .filter((r) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 14);
      return r.date >= cutoff.toISOString().split("T")[0];
    })
    .slice(-50);

  const medicationSummary = medications
    .filter((m) => m.active)
    .map(
      (m) =>
        `${m.name} (${m.dosage} ${m.unit}, ${m.frequency}, ${m.times.length} time(s)/day)`
    )
    .join("; ");

  const missedByMed: Record<string, number> = {};
  const takenByMed: Record<string, number> = {};

  for (const r of recentRecords) {
    if (r.status === "missed") missedByMed[r.medicationName] = (missedByMed[r.medicationName] ?? 0) + 1;
    if (r.status === "taken") takenByMed[r.medicationName] = (takenByMed[r.medicationName] ?? 0) + 1;
  }

  const prompt = `You are a caring medical adherence coach. Analyze this patient's medication data and provide personalized, actionable insights.

Patient medications: ${medicationSummary || "No active medications"}
Overall adherence rate (last 7 days): ${adherenceRate}%
Recent dose history (last 14 days):
- Total doses recorded: ${recentRecords.length}
- Taken: ${recentRecords.filter((r) => r.status === "taken").length}
- Missed: ${recentRecords.filter((r) => r.status === "missed").length}
- Skipped: ${recentRecords.filter((r) => r.status === "skipped").length}
${Object.keys(missedByMed).length > 0 ? `Most missed medications: ${Object.entries(missedByMed).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n, c]) => `${n} (${c}x)`).join(", ")}` : ""}

Respond in JSON format with this structure:
{
  "insights": [
    {"type": "tip|warning|achievement|suggestion", "title": "short title", "message": "2-3 sentence actionable message"}
  ],
  "overallMessage": "1-2 sentence warm, encouraging overall message",
  "adherenceScore": ${adherenceRate}
}

Provide 2-4 insights. Be specific, warm, and practical. Focus on the data. Do not give medical advice about changing medications.`;

  const response = await fetch(`${BASE_URL}/api/ai/coach`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error("Failed to get AI insights");
  }

  const data = await response.json();
  return data as AICoachResponse;
}
