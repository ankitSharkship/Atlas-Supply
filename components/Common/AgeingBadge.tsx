import Colors from "@/constants/colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export const AgeingBadge = ({ ageing, pendingSince }: { ageing: string; pendingSince: string }) => {
  const getAgeingConfig = (age: string) => {
    if (!age) return { color: Colors.textSecondary, badgeBg: "#F9FAFB", label: "NA" };
    
    if (age.includes("<24")) {
      return { color: "#10B981", badgeBg: "#ECFDF5", label: age };
    } else if (age.includes("24-48")) {
      return { color: "#F59E0B", badgeBg: "#FFFBEB", label: age };
    } else if (age.includes(">48")) {
      return { color: "#EF4444", badgeBg: "#FEF2F2", label: age };
    }
    return { color: Colors.textSecondary, badgeBg: "#F9FAFB", label: age };
  };

  const config = getAgeingConfig(ageing);

  // Format pendingSince: 2026-04-01T14:15:55.225516+05:30
  const date = new Date(pendingSince);
  const formattedDate = isNaN(date.getTime()) 
    ? "NA" 
    : `${String(date.getDate()).padStart(2, '0')}-${date.toLocaleString('en-US', { month: 'short' })} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  return (
    <View style={styles.horizontalContainer}>
      <View style={styles.pendingInfo}>
        <Text style={styles.pendingLabel}>Pending Since:</Text>
        <Text style={styles.pendingDate}>{formattedDate}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: config.badgeBg, borderColor: config.color + "30" }]}>
        <View style={[styles.dot, { backgroundColor: config.color }]} />
        <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
    width: "100%",
  },
  pendingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  pendingLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  pendingDate: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
});
