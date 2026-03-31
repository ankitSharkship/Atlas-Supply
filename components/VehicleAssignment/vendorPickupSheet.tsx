// components/VendorPickerSheet.tsx
import { Colors } from "@/constants/colors";
import { getVendorsLookup, Vendor } from "@/lib/vehicleAssignmentService";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface Props {
  onSelect: (vendor: Vendor) => void;
}

const VendorPickerSheet = forwardRef<BottomSheet, Props>(
  ({ onSelect }, ref) => {
    const snapPoints = useMemo(() => ["60%", "90%"], []);
    const [search, setSearch] = useState("");
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchVendors = useCallback(async (q: string) => {
      setLoading(true);
      try {
        const res = await getVendorsLookup(q);
        if (res?.success) {
          setVendors(res.data.vendors);
        }
      } catch (e) {
        console.error("Failed to load vendors", e);
      } finally {
        setLoading(false);
      }
    }, []);

    // Initial load with empty query
    useEffect(() => {
      fetchVendors("");
    }, [fetchVendors]);

    // Debounce search
    const handleSearch = (text: string) => {
      setSearch(text);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        fetchVendors(text);
      }, 500);
    };

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
            onChangeText={handleSearch}
            autoCapitalize="none"
          />

          {loading ? (
            <ActivityIndicator
              style={{ marginTop: 20 }}
              color={Colors.primary}
            />
          ) : (
            <FlatList
              data={vendors}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No vendors found</Text>
              }
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
          )}
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

  emptyText: {
    textAlign: "center",
    color: Colors.textSecondary,
    marginTop: 20,
    fontSize: 14,
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