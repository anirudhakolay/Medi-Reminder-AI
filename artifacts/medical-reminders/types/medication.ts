export type FrequencyType =
  | "daily"
  | "twice_daily"
  | "three_times_daily"
  | "four_times_daily"
  | "weekly"
  | "as_needed"
  | "custom";

export type DoseStatus = "pending" | "taken" | "skipped" | "missed";

export interface MedicationTime {
  hour: number;
  minute: number;
  label?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  unit: string;
  frequency: FrequencyType;
  times: MedicationTime[];
  startDate: string;
  endDate?: string;
  instructions?: string;
  color: string;
  withFood: boolean;
  active: boolean;
  createdAt: string;
  notificationIds?: string[];
}

export interface DoseRecord {
  id: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  takenTime?: string;
  status: DoseStatus;
  date: string;
  notes?: string;
}

export interface TodayDose {
  medication: Medication;
  time: MedicationTime;
  scheduledDateTime: Date;
  status: DoseStatus;
  recordId?: string;
}
