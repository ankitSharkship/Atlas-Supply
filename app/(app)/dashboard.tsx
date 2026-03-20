import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { getLoadingMemoDisplay } from "@/lib/loadingMemoSerivce";
import { getVehicleAssignmentDisplay } from "@/lib/vehicleAssignmentService";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const VR_SUBMITTED_KEY = "vr_submitted";
const DS_SUBMITTED_KEY = "ds_submitted";

interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconLib: "feather" | "mci";
  color: string;
  bgColor: string;
  route: string;
  pending: number;
  roles: ("supply" | "central")[];
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [lmPending, setLmPending] = useState(0);
  const [vaPending, setVaPending] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadCounts = async () => {
    try {
      const lmData = await getLoadingMemoDisplay(user?.zone);
      const vaData = await getVehicleAssignmentDisplay(user?.zone);
      setLmPending(lmData.total_count || 0);
      setVaPending(vaData.total_count || 0);
    } catch (error) {
      console.error("Failed to load counts:", error);
    }
  };

  useEffect(() => {
    loadCounts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCounts();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const allCards: DashboardCard[] = [
    {
      id: "vehicleassignment",
      title: "Pending to Assign Truck",
      description: "Update Vehicle Assignment Details",
      icon: "truck-check",
      iconLib: "mci",
      color: Colors.accent,
      bgColor: "#FFF3E8",
      route: "/(app)/vehicleAssignment",
      pending: vaPending,
      roles: ["supply"],
    },
    {
      id: "loadingmemodetails",
      title: "Loading Memo Details",
      description: "Loading Memo Details",
      icon: "file-text",
      iconLib: "feather",
      color: Colors.primary,
      bgColor: "#EBF1FF",
      route: "/(app)/loadingmemoDetails",
      pending: lmPending,
      roles: ["supply"],
    },
    {
      id: "addintermitentcharges",
      title: "Add Intermitent Charges",
      description: "Add new Intermitent Charges",
      icon: "file-text",
      iconLib: "feather",
      color: Colors.primary,
      bgColor: "#EBF1FF",
      route: "/(app)/addIntermitentCharges",
      pending: 0,
      roles: ["supply"],
    },
  ];

  const visibleCards = allCards.filter((card) => {
    if (!user?.role) return false;

    if (user.role === "ADMIN") {
      return true;
    }

    if (user.role === "supply_employee") {
      return card.id === "loadingmemodetails";
    }

    return false;
  });
  const handleCardPress = async (card: DashboardCard) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(card.route as any);
  };

  const roleLabel =
    user?.role === "ADMIN"
      ? "Administrator"
      : user?.role === "SUPPLY"
        ? "Supply Employee"
        : "User";

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.email.split("@")[0]}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{roleLabel}</Text>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <Feather name="log-out" size={20} color={Colors.white} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.cardsGrid}>
          {visibleCards.map((card) => (
            <Pressable
              key={card.id}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
              onPress={() => handleCardPress(card)}
            >
              <View style={styles.cardTop}>
                <View
                  style={[styles.iconBg, { backgroundColor: card.bgColor }]}
                >
                  {card.iconLib === "mci" ? (
                    <MaterialCommunityIcons
                      name={card.icon as any}
                      size={26}
                      color={card.color}
                    />
                  ) : (
                    <Feather
                      name={card.icon as any}
                      size={26}
                      color={card.color}
                    />
                  )}
                </View>
                {card.id !== "addintermitentcharges" && (
                  <View
                    style={[
                      styles.pendingBadge,
                      { backgroundColor: card.color },
                    ]}
                  >
                    <Text style={styles.pendingCount}>{card.pending}</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardDescription}>{card.description}</Text>
              </View>

              <View style={styles.cardFooter}>
                {card.id !== "addintermitentcharges" && (
                  <Text style={[styles.pendingLabel, { color: card.color }]}>
                    {card.pending} pending
                  </Text>
                )}
                {card.id === "addintermitentcharges" && <Text></Text>}
                <View
                  style={[
                    styles.arrowCircle,
                    { backgroundColor: card.bgColor },
                  ]}
                >
                  <Feather name="arrow-right" size={14} color={card.color} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Feather name="info" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>
            Pull down to refresh pending counts. All submissions are tracked in
            real time.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  greeting: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
    textTransform: "capitalize",
  },
  roleBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  roleBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.white,
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  summaryBar: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    flexDirection: "row",
    justifyContent: "center",
  },
  summaryNumber: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 14,
  },
  cardsGrid: {
    gap: 14,
    marginBottom: 20,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingBadge: {
    minWidth: 32,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  pendingCount: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  cardBody: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
  },
  pendingLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#EBF1FF",
    borderRadius: 12,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.primary,
    lineHeight: 18,
  },
});
