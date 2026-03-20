import BottomSheet from "@gorhom/bottom-sheet";
import React, { forwardRef } from "react";
import { View, TextInput, Text, Pressable } from "react-native";

export const VendorPickerSheet = forwardRef(
  ({ vendors, query, setQuery, loading, onSelect }: any, ref: any) => {
    return (
      <BottomSheet ref={ref} index={-1} snapPoints={["60%"]}>
        <View style={{ padding: 16 }}>
          <TextInput
            placeholder="Search vendor..."
            value={query}
            onChangeText={setQuery}
            style={{
              borderWidth: 1,
              borderRadius: 8,
              padding: 10,
              marginBottom: 10,
            }}
          />

          {loading && <Text>Loading...</Text>}

          {vendors.map((v: any) => (
            <Pressable
              key={v.id}
              onPress={() => onSelect(v)}
              style={{ padding: 12 }}
            >
              <Text>{v.vendor_company_name}</Text>
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    );
  }
);