import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  rate: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function AdherenceRing({ rate, size = 100, strokeWidth = 10, label }: Props) {
  const colors = useColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(rate / 100, 0), 1);
  const dash = circumference * progress;
  const gap = circumference - dash;

  const ringColor =
    rate >= 80
      ? colors.success
      : rate >= 50
      ? colors.warning
      : colors.destructive;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.bg, { width: size, height: size, borderRadius: size / 2, borderColor: colors.muted, borderWidth: strokeWidth }]} />
      <View style={[styles.progressContainer, { width: size, height: size }]}>
        <View
          style={[
            styles.arc,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderTopColor: ringColor,
              borderRightColor: progress > 0.25 ? ringColor : "transparent",
              borderBottomColor: progress > 0.5 ? ringColor : "transparent",
              borderLeftColor: progress > 0.75 ? ringColor : "transparent",
              transform: [{ rotate: `${progress * 360}deg` }],
            },
          ]}
        />
      </View>
      <View style={styles.center}>
        <Text style={[styles.percent, { color: colors.foreground }]}>{rate}%</Text>
        {label && (
          <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bg: {
    position: "absolute",
  },
  progressContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  arc: {
    position: "absolute",
  },
  center: {
    alignItems: "center",
    zIndex: 10,
  },
  percent: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
