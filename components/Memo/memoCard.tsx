import Colors from "@/constants/colors";
import { LoadingMemoData } from "@/lib/loadingMemoSerivce";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function MemoCard({
  item,
  onUpload,
}: {
  item: LoadingMemoData;
  onUpload: (item: LoadingMemoData) => void;
}) {
  const createdDate = new Date(item.created_on);
  const dateStr = `${String(createdDate.getDate()).padStart(2, "0")}-${String(
    createdDate.getMonth() + 1,
  ).padStart(2, "0")}-${createdDate.getFullYear()}`;
  const timeStr = `${String(createdDate.getHours()).padStart(2, "0")}:${String(
    createdDate.getMinutes(),
  ).padStart(2, "0")}`;

  const uploaded = !!item.loading_memo;

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.cardTop}>
        <View style={cardStyles.cardTopLeft}>
          <Text style={cardStyles.enquiryNo}>{item.vehicle_no}</Text>
          <Text style={cardStyles.dateText}>
            {dateStr} {timeStr}
          </Text>
        </View>
        <View style={cardStyles.statusBadge}>
          <Text style={cardStyles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={cardStyles.cardBody}>
        <View style={cardStyles.rowInfo}>
          <Feather name="briefcase" size={13} color={Colors.textSecondary} />
          <Text style={cardStyles.customerName} numberOfLines={2}>
            {item.customer_name}
          </Text>
        </View>

        <View style={cardStyles.routeRow}>
          <View style={cardStyles.routePoint}>
            <View
              style={[cardStyles.dot, { backgroundColor: Colors.success }]}
            />
            <Text style={cardStyles.routeText} numberOfLines={1}>
              {item.from_location}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="arrow-right"
            size={16}
            color={Colors.textLight}
          />
          <View style={cardStyles.routePoint}>
            <View style={[cardStyles.dot, { backgroundColor: Colors.error }]} />
            <Text style={cardStyles.routeText} numberOfLines={1}>
              {item.to_location}
            </Text>
          </View>
        </View>
      </View>

      <View style={cardStyles.cardFooter}>
        <View style={cardStyles.footerLeft}>
          <View style={cardStyles.footerItem}>
            <Text style={cardStyles.footerText}>{item.enquiry_no}</Text>
          </View>
          <View style={cardStyles.footerSep} />
          {/* <View style={cardStyles.footerItem}>
            {uploaded ? (
              <Feather name="check-circle" size={13} color={Colors.success} />
            ) : (
              <Feather name="clock" size={13} color={Colors.textLight} />
            )}
            <Text
              style={[
                cardStyles.footerText,
                uploaded && { color: Colors.success },
              ]}
            >
              {uploaded ? "Uploaded" : "Pending"}
            </Text>
          </View> */}
        </View>

        <Pressable
          style={({ pressed }) => [
            cardStyles.uploadBtn,
            uploaded && cardStyles.uploadBtnDone,
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => onUpload(item)}
        >
          <Feather
            name={uploaded ? "refresh-cw" : "upload"}
            size={15}
            color={Colors.white}
          />
          <Text style={cardStyles.uploadBtnText}>
            {uploaded ? "Re-upload" : "Upload"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTopLeft: { gap: 2 },
  enquiryNo: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  dateText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textLight,
  },
  statusBadge: {
    backgroundColor: "#F3F0FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#7C3AED" },
  cardBody: { gap: 10, marginBottom: 14 },
  rowInfo: { flexDirection: "row", alignItems: "center", gap: 6 },
  customerName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
    flex: 1,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  routePoint: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  routeText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  footerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textLight,
  },
  footerSep: { width: 1, height: 12, backgroundColor: Colors.border },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  uploadBtnDone: {
    backgroundColor: Colors.success,
  },
  uploadBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
  },
});
