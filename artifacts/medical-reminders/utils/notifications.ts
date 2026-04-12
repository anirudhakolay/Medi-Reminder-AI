import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Medication } from "@/types/medication";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    finalStatus = status;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("medication-reminders", {
      name: "Medication Reminders",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    });

    await Notifications.setNotificationChannelAsync("medication-alerts", {
      name: "Missed Medication Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
      sound: "default",
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    });
  }

  return finalStatus === "granted";
}

function getNotificationId(medicationId: string, dayOffset: number, timeIndex: number): string {
  return `med_${medicationId}_d${dayOffset}_t${timeIndex}`;
}

export async function cancelAllMedicationNotifications(medicationId: string): Promise<void> {
  if (Platform.OS === "web") return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter((n) =>
    n.identifier.startsWith(`med_${medicationId}`)
  );
  await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

export async function scheduleAllNotifications(medications: Medication[]): Promise<void> {
  if (Platform.OS === "web") return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const medIds = medications.map((m) => m.id);
  const toCancel = scheduled.filter((n) => {
    const match = n.identifier.match(/^med_([^_]+)/);
    return match && !medIds.includes(match[1]);
  });
  await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));

  for (const med of medications) {
    if (!med.active) {
      await cancelAllMedicationNotifications(med.id);
      continue;
    }

    await cancelAllMedicationNotifications(med.id);

    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      const dateStr = date.toISOString().split("T")[0];

      if (med.startDate > dateStr) continue;
      if (med.endDate && med.endDate < dateStr) continue;

      for (let i = 0; i < med.times.length; i++) {
        const time = med.times[i];
        const trigger = new Date(date);
        trigger.setHours(time.hour, time.minute, 0, 0);

        if (trigger <= new Date()) continue;

        const notifId = getNotificationId(med.id, dayOffset, i);

        try {
          await Notifications.scheduleNotificationAsync({
            identifier: notifId,
            content: {
              title: `Time for ${med.name}`,
              body: `${med.dosage} ${med.unit}${med.withFood ? " — take with food" : ""}${med.instructions ? `\n${med.instructions}` : ""}`,
              sound: "default",
              priority: Notifications.AndroidNotificationPriority.HIGH,
              data: {
                medicationId: med.id,
                scheduledTime: `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`,
                type: "medication_reminder",
              },
              ...(Platform.OS === "android" && {
                channelId: "medication-reminders",
              }),
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: trigger,
            },
          });
        } catch (_e) {
        }
      }
    }
  }
}

export function formatTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, "0");
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:${m} ${ampm}`;
}
