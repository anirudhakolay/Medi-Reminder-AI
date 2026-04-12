import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet, Text, View, useColorScheme } from "react-native";
import { useColors } from "@/hooks/useColors";

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return (
    <Text style={{ fontSize: 20, color, textAlign: "center" }}>{emoji}</Text>
  );
}

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Today</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="medications">
        <Icon sf={{ default: "pill", selected: "pill.fill" }} />
        <Label>Medications</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <Icon sf={{ default: "calendar", selected: "calendar.fill" }} />
        <Label>History</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="coach">
        <Icon sf={{ default: "brain.head.profile", selected: "brain.head.profile.fill" }} />
        <Label>AI Coach</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: isWeb ? 84 : 60,
          paddingBottom: isWeb ? 34 : 8,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]}
            />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Inter_500Medium",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={22} />
            ) : (
              <TabIcon emoji="🏠" color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          title: "Medications",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="pill" tintColor={color} size={22} />
            ) : (
              <TabIcon emoji="💊" color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="calendar" tintColor={color} size={22} />
            ) : (
              <TabIcon emoji="📅" color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: "AI Coach",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="brain.head.profile" tintColor={color} size={22} />
            ) : (
              <TabIcon emoji="🤖" color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}
