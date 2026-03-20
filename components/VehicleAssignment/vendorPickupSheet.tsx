// components/VendorPickerSheet.tsx
import { Colors } from "@/constants/colors";
import { Vendor } from "@/lib/vehicleAssignmentService";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import React, { forwardRef, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface Props {
  vendors: Vendor[];
  onSelect: (vendor: Vendor) => void;
}

const VendorPickerSheet = forwardRef<BottomSheet, Props>(
  ({ vendors, onSelect }, ref) => {
    const snapPoints = useMemo(() => ["60%", "90%"], []);
    const [search, setSearch] = useState("");

    const filtered = vendors.filter((v) =>
      v.vendor_company_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: Colors.card }}
      >
        <BottomSheetView style={styles.container}>
          <Text style={styles.title}>Select Vendor</Text>

          <TextInput
            style={styles.search}
            placeholder="Search vendor..."
            value={search}
            onChangeText={setSearch}
          />

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Pressable
                style={styles.vendorItem}
                onPress={() => onSelect(item)}
              >
                <View style={styles.vendorRow}>
                  <View style={styles.dot} />

                  <View>
                    <Text style={styles.vendorName}>
                      {item.vendor_company_name}
                    </Text>

                    <Text style={styles.vendorMeta}>
                      {item.primary_mobile_no}
                      {item.vendor_gst ? ` • ${item.vendor_gst}` : ""}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}
          />
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

export default VendorPickerSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },

  search: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },

  vendorItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },

  vendorRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: 8,
  },

  vendorName: {
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },

  vendorMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});