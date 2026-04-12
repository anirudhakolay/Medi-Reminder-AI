import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { DoseRecord, DoseStatus, Medication, TodayDose } from "@/types/medication";
import {
  cancelAllMedicationNotifications,
  scheduleAllNotifications,
} from "@/utils/notifications";

const MEDICATIONS_KEY = "@medications";
const DOSE_RECORDS_KEY = "@dose_records";

interface MedicationContextType {
  medications: Medication[];
  doseRecords: DoseRecord[];
  todayDoses: TodayDose[];
  isLoading: boolean;
  addMedication: (medication: Medication) => Promise<void>;
  updateMedication: (medication: Medication) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  recordDose: (
    medicationId: string,
    scheduledTime: string,
    status: DoseStatus,
    notes?: string
  ) => Promise<void>;
  getAdherenceStats: (days?: number) => {
    rate: number;
    taken: number;
    missed: number;
    skipped: number;
    total: number;
  };
  refreshTodayDoses: () => void;
}

const MedicationContext = createContext<MedicationContextType | undefined>(
  undefined
);

function buildTodayDoses(
  medications: Medication[],
  doseRecords: DoseRecord[]
): TodayDose[] {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const doses: TodayDose[] = [];

  for (const med of medications) {
    if (!med.active) continue;
    if (med.startDate > todayStr) continue;
    if (med.endDate && med.endDate < todayStr) continue;

    for (const time of med.times) {
      const scheduledDateTime = new Date(today);
      scheduledDateTime.setHours(time.hour, time.minute, 0, 0);

      const timeStr = `${String(time.hour).padStart(2, "0")}:${String(
        time.minute
      ).padStart(2, "0")}`;

      const record = doseRecords.find(
        (r) =>
          r.medicationId === med.id &&
          r.date === todayStr &&
          r.scheduledTime === timeStr
      );

      let status: DoseStatus = "pending";
      if (record) {
        status = record.status;
      } else if (scheduledDateTime < new Date()) {
        status = "missed";
      }

      doses.push({
        medication: med,
        time,
        scheduledDateTime,
        status,
        recordId: record?.id,
      });
    }
  }

  return doses.sort(
    (a, b) => a.scheduledDateTime.getTime() - b.scheduledDateTime.getTime()
  );
}

export function MedicationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doseRecords, setDoseRecords] = useState<DoseRecord[]>([]);
  const [todayDoses, setTodayDoses] = useState<TodayDose[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTodayDoses = useCallback(() => {
    setTodayDoses(buildTodayDoses(medications, doseRecords));
  }, [medications, doseRecords]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setTodayDoses(buildTodayDoses(medications, doseRecords));
  }, [medications, doseRecords]);

  async function loadData() {
    try {
      const [medsRaw, recordsRaw] = await Promise.all([
        AsyncStorage.getItem(MEDICATIONS_KEY),
        AsyncStorage.getItem(DOSE_RECORDS_KEY),
      ]);
      const meds: Medication[] = medsRaw ? JSON.parse(medsRaw) : [];
      const records: DoseRecord[] = recordsRaw ? JSON.parse(recordsRaw) : [];
      setMedications(meds);
      setDoseRecords(records);
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveMedications(meds: Medication[]) {
    await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(meds));
    setMedications(meds);
  }

  async function saveDoseRecords(records: DoseRecord[]) {
    await AsyncStorage.setItem(DOSE_RECORDS_KEY, JSON.stringify(records));
    setDoseRecords(records);
  }

  async function addMedication(medication: Medication) {
    const updated = [...medications, medication];
    await saveMedications(updated);
    await scheduleAllNotifications(updated);
  }

  async function updateMedication(medication: Medication) {
    const updated = medications.map((m) =>
      m.id === medication.id ? medication : m
    );
    await saveMedications(updated);
    await scheduleAllNotifications(updated);
  }

  async function deleteMedication(id: string) {
    await cancelAllMedicationNotifications(id);
    const updated = medications.filter((m) => m.id !== id);
    await saveMedications(updated);
  }

  async function recordDose(
    medicationId: string,
    scheduledTime: string,
    status: DoseStatus,
    notes?: string
  ) {
    const today = new Date().toISOString().split("T")[0];
    const existing = doseRecords.find(
      (r) =>
        r.medicationId === medicationId &&
        r.date === today &&
        r.scheduledTime === scheduledTime
    );

    const med = medications.find((m) => m.id === medicationId);
    const newRecord: DoseRecord = {
      id: existing?.id ?? Date.now().toString() + Math.random().toString(36).substr(2, 9),
      medicationId,
      medicationName: med?.name ?? "",
      scheduledTime,
      takenTime: status === "taken" ? new Date().toISOString() : undefined,
      status,
      date: today,
      notes,
    };

    let updated: DoseRecord[];
    if (existing) {
      updated = doseRecords.map((r) =>
        r.id === existing.id ? newRecord : r
      );
    } else {
      updated = [...doseRecords, newRecord];
    }

    await saveDoseRecords(updated);
  }

  function getAdherenceStats(days = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const recent = doseRecords.filter((r) => r.date >= cutoffStr);
    const taken = recent.filter((r) => r.status === "taken").length;
    const missed = recent.filter((r) => r.status === "missed").length;
    const skipped = recent.filter((r) => r.status === "skipped").length;
    const total = recent.length;
    const rate = total > 0 ? Math.round((taken / total) * 100) : 0;

    return { rate, taken, missed, skipped, total };
  }

  return (
    <MedicationContext.Provider
      value={{
        medications,
        doseRecords,
        todayDoses,
        isLoading,
        addMedication,
        updateMedication,
        deleteMedication,
        recordDose,
        getAdherenceStats,
        refreshTodayDoses,
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
}

export function useMedications() {
  const ctx = useContext(MedicationContext);
  if (!ctx) throw new Error("useMedications must be used within MedicationProvider");
  return ctx;
}
