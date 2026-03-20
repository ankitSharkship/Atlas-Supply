import { Colors } from "@/constants/colors";
import {
  VehicleType,
  getVehicleTypesLookup,
} from "@/lib/vehicleAssignmentService";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import React, {
  forwardRef,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface Props {
  onSelect: (vehicle: VehicleType) => void;
}

const VehicleTypeSheet = forwardRef<BottomSheet, Props>(
  ({ onSelect }, ref) => {
    const snapPoints = useMemo(() => ["60%", "90%"], []);

    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
      const loadVehicleTypes = async () => {
        try {
          const res = await getVehicleTypesLookup();

          if (res.success) {
            setVehicleTypes(res.data.vehicle_types);
          }
        } catch (err) {
          console.error("Vehicle types lookup failed", err);
        }
      };

      loadVehicleTypes();
    }, []);

    const filtered = vehicleTypes.filter((v) => {
      const q = search.toLowerCase();

      return (
        v.display_text.toLowerCase().includes(q) ||
        v.vehicle_name.toLowerCase().includes(q) ||
        v.vehicle_tonnage.toLowerCase().includes(q)
      );
    });

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: Colors.card }}
      >
        <BottomSheetView style={styles.container}>
          <Text style={styles.title}>Select Vehicle Type</Text>

          <TextInput
            style={styles.search}
            placeholder="Search vehicle type..."
            value={search}
            onChangeText={setSearch}
          />

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={styles.item}
                onPress={() => onSelect(item)}
              >
                <View style={styles.row}>
                  <View style={styles.dot} />

                  <Text style={styles.name}>
                    {item.display_text}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

export default VehicleTypeSheet;

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

  item: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },

  name: {
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
});