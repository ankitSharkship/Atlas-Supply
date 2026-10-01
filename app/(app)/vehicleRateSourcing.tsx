import { RateSourcingCard } from "@/components/VehicleRateSourcing/rateSourcingCard";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import {
  getRateSourcingDisplay,
  getVendorsLookupPost,
  insertOrUpdateRateSourcing,
  RateSourcingItem,
  VendorLookupItem,
} from "@/lib/rateSourcingService";
import { AgeingBadge } from "@/components/Common/AgeingBadge";
import { PaginationBar } from "@/components/Common/PaginationBar";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VehicleRateSourcingScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 30 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const [items, setItems] = useState<RateSourcingItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const appliedSearchRef = useRef("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RateSourcingItem | null>(null);
  const [form, setForm] = useState({
    l1_vendor: "" as string,
    l1_rate: "" as string,
    l2_vendor: "" as string,
    l2_rate: "" as string,
    l3_vendor: "" as string,
    l3_rate: "" as string,
  });

  // Vendor Search State
  const [vendorModalVisible, setVendorModalVisible] = useState(false);
  const {user} = useAuth();
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendors, setVendors] = useState<VendorLookupItem[]>([]);
  const [isVendorLoading, setIsVendorLoading] = useState(false);
  const [activeVendorField, setActiveVendorField] = useState<"l1" | "l2" | "l3" | null>(null);
  const vendorDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await getRateSourcingDisplay(user?.zone, page, PAGE_SIZE, appliedSearch);
      setItems(response.rate_sourcing_data);
      setTotalCount(response.total_count);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load rate sourcing data.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [page, appliedSearch]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  // Debounce the search input; only hit the API once the query is empty
  // (reset) or longer than 2 characters.
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      const trimmed = searchQuery.trim();
      if (
        (trimmed.length === 0 || trimmed.length > 2) &&
        trimmed !== appliedSearchRef.current
      ) {
        appliedSearchRef.current = trimmed;
        setIsLoading(true);
        setPage(0);
        setAppliedSearch(trimmed);
      }
    }, 500);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const hasPrev = page > 0;
  const hasNext = (page + 1) * PAGE_SIZE < totalCount;

  const goToPrevPage = () => {
    if (!hasPrev) return;
    setIsLoading(true);
    setPage((p) => p - 1);
  };

  const goToNextPage = () => {
    if (!hasNext) return;
    setIsLoading(true);
    setPage((p) => p + 1);
  };

  const handleAction = (item: RateSourcingItem) => {
    setSelectedItem(item);
    setForm({
      l1_vendor: item.l1_vendor_name || "",
      l1_rate: item.l1_rate ? item.l1_rate.toString() : "",
      l2_vendor: item.l2_vendor_name || "",
      l2_rate: item.l2_rate ? item.l2_rate.toString() : "",
      l3_vendor: item.l3_vendor_name || "",
      l3_rate: item.l3_rate ? item.l3_rate.toString() : "",
    });
    setModalVisible(true);
  };

  const fetchVendors = async (q: string) => {
    setIsVendorLoading(true);
    try {
      const res = await getVendorsLookupPost(q);
      setVendors(res.data.vendors);
    } catch (e) {
      console.error("Failed to fetch vendors", e);
    } finally {
      setIsVendorLoading(false);
    }
  };

  const handleVendorSearch = (text: string) => {
    setVendorSearch(text);
    if (vendorDebounceTimer.current) clearTimeout(vendorDebounceTimer.current);
    vendorDebounceTimer.current = setTimeout(() => {
      fetchVendors(text);
    }, 500);
  };

  const openVendorPicker = (field: "l1" | "l2" | "l3") => {
    setActiveVendorField(field);
    setVendorSearch("");
    setVendors([]);
    setVendorModalVisible(true);
    fetchVendors(""); // Initial load
  };

  const selectVendor = (vendor: VendorLookupItem) => {
    if (!activeVendorField) return;

    // Check if vendor already selected in other L2/L3 fields
    if (activeVendorField === "l2" && vendor.company_name === form.l3_vendor) {
        Alert.alert("Invalid Selection", "L2 and L3 cannot have the same Vendor Company name.");
        return;
    }
    if (activeVendorField === "l3" && vendor.company_name === form.l2_vendor) {
        Alert.alert("Invalid Selection", "L2 and L3 cannot have the same Vendor Company name.");
        return;
    }

    setForm({ ...form, [`${activeVendorField}_vendor`]: vendor.company_name || vendor.vendor_company_name || "" });
    setVendorModalVisible(false);
  };

  const handleSubmit = async () => {
    if (!selectedItem) return;

    // Validation
    if (form.l2_vendor && !form.l2_rate) {
      Alert.alert("Required", "L1 Rate is mandatory if L1 Vendor is selected.");
      return;
    }
    if (form.l3_vendor && !form.l3_rate) {
      Alert.alert("Required", "L2 Rate is mandatory if L2 Vendor is selected.");
      return;
    }
    if (form.l2_vendor && form.l3_vendor && form.l2_vendor === form.l3_vendor) {
        Alert.alert("Invalid", "L1 and L2 cannot have the same Vendor Company name.");
        return;
    }

    try {
      setIsLoading(true);
      const payload = {
        enquiry_no: selectedItem.enquiry_no,
        l1_vendor_name: form.l1_vendor || null,
        l1_rate: form.l1_rate ? parseFloat(form.l1_rate) : null,
        l2_vendor_name: form.l2_vendor || null,
        l2_rate: form.l2_rate ? parseFloat(form.l2_rate) : null,
        l3_vendor_name: form.l3_vendor || null,
        l3_rate: form.l3_rate ? parseFloat(form.l3_rate) : null,
      };

      const res = await insertOrUpdateRateSourcing(payload);
      Alert.alert("Success", res.message || "Rates updated successfully!");
      setModalVisible(false);
      fetchData();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to submit rates.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.white} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Vehicle Rate Sourcing</Text>
          <Text style={styles.headerSubtitle}>
            Bid and source vehicles for enquiries
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>{totalCount}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInner}>
          <Feather name="search" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchBarInput}
            placeholder="Search by Enquiry, Customer, Vendor, Route..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textLight}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                if (appliedSearchRef.current !== "") {
                  appliedSearchRef.current = "";
                  setIsLoading(true);
                  setPage(0);
                  setAppliedSearch("");
                }
              }}
            >
              <Feather name="x-circle" size={16} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      {isLoading && !refreshing ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={{ marginTop: 80 }}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.enquiry_no}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomPad + 96 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <RateSourcingCard item={item} onAction={handleAction} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="card-search-outline"
                size={56}
                color={Colors.border}
              />
              <Text style={styles.emptyTitle}>No Enquiries</Text>
              <Text style={styles.emptyText}>
                No vehicle rate sourcing enquiries found.
              </Text>
            </View>
          }
        />
      )}

      <PaginationBar
        page={page}
        hasPrev={hasPrev && !isLoading}
        hasNext={hasNext && !isLoading}
        onPrev={goToPrevPage}
        onNext={goToNextPage}
        bottomInset={bottomPad}
        fadeColor={Colors.background}
      />

      {/* VRS Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Bid Rates</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text style={styles.itemRef}>Enquiry: {selectedItem?.enquiry_no}</Text>

              {selectedItem && (
                 <View style={styles.vrsBanner}>
                   <View style={styles.vrsBannerRow}>
                     <View style={styles.vrsBannerCol}>
                       <Text style={styles.vrsBannerLabel}>Customer</Text>
                       <Text style={styles.vrsBannerValue} numberOfLines={2}>{selectedItem.customer_name}</Text>
                     </View>
                     <AgeingBadge ageing={selectedItem.ageing} pendingSince={selectedItem.pending_since} />
                   </View>
                   
                   <View style={styles.vrsBannerDivider} />
                   
                   <View style={styles.vrsBannerInfo}>
                     <Text style={styles.vrsBannerLabel}>Route</Text>
                     <Text style={styles.vrsBannerValue}>{selectedItem.from_location} → {selectedItem.to_location}</Text>
                   </View>
                   
                   <View style={styles.vrsBannerGrid}>
                     <View style={styles.vrsBannerItem}>
                        <Text style={styles.vrsBannerLabel}>Vehicle Type</Text>
                        <Text style={styles.vrsBannerValue}>{selectedItem.vehicle_type}</Text>
                     </View>
                     <View style={styles.vrsBannerItem}>
                        <Text style={styles.vrsBannerLabel}>Weight</Text>
                        <Text style={styles.vrsBannerValue}>{selectedItem.material_weight} {selectedItem.weight_unit}</Text>
                     </View>
                   </View>
                 </View>
               )}

              {/* Standard Rate Sections (L1 & L2) */}
              <View style={styles.standardCard}>
                <Text style={styles.sectionTitle}>L1 Rate Details</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Vendor Company Name</Text>
                  <TouchableOpacity 
                    style={styles.dropdownTrigger}
                    onPress={() => openVendorPicker("l2")}
                  >
                    <Text style={[styles.dropdownText, !form.l2_vendor && { color: Colors.textLight }]}>
                      {form.l2_vendor || "Select L1 Vendor"}
                    </Text>
                    <Feather name="chevron-down" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>L1 Rate</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.l2_rate}
                    onChangeText={(t) => setForm({ ...form, l2_rate: t })}
                    placeholder="Enter L1 rate"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* L3 Rate Section -> New L2 */}
              <View style={[styles.standardCard, { marginBottom: 20 }]}>
                <Text style={styles.sectionTitle}>L2 Rate Details</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Vendor Company Name</Text>
                  <TouchableOpacity 
                    style={styles.dropdownTrigger}
                    onPress={() => openVendorPicker("l3")}
                  >
                    <Text style={[styles.dropdownText, !form.l3_vendor && { color: Colors.textLight }]}>
                      {form.l3_vendor || "Select L2 Vendor"}
                    </Text>
                    <Feather name="chevron-down" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>L2 Rate</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.l3_rate}
                    onChangeText={(t) => setForm({ ...form, l3_rate: t })}
                    placeholder="Enter L2 rate"
                    keyboardType="numeric"
                  />
                </View>
              </View>

                {/* Final Rate Section (Old L1) - Highlighted */}
              <View style={styles.highlightCard}>
                <View style={styles.sectionTitleRow}>
                    <View style={styles.l1Badge}><Text style={styles.l1BadgeText}>Final</Text></View>
                    <Text style={styles.highlightTitle}>Final Rate Details</Text>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Vendor Company Name</Text>
                  <TouchableOpacity 
                    style={styles.dropdownTrigger}
                    onPress={() => openVendorPicker("l1")}
                  >
                    <Text style={[styles.dropdownText, !form.l1_vendor && { color: Colors.textLight }]}>
                      {form.l1_vendor || "Select Final Vendor"}
                    </Text>
                    <Feather name="chevron-down" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Final Rate</Text>
                  <TextInput
                    style={styles.textInputHighlight}
                    value={form.l1_rate}
                    onChangeText={(t) => setForm({ ...form, l1_rate: t })}
                    placeholder="Enter final rate"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { paddingBottom: 16 + bottomPad }]}>
                <TouchableOpacity 
                    style={styles.cancelBtn} 
                    onPress={() => setModalVisible(false)}
                >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.submitBtn} 
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                        <Text style={styles.submitBtnText}>Submit Bid</Text>
                    )}
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Vendor Picker Modal */}
      <Modal
        visible={vendorModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setVendorModalVisible(false)}
      >
        <View style={styles.vendorModalOverlay}>
          <View style={styles.vendorModalContent}>
            <View style={styles.vendorModalHeader}>
              <Text style={styles.vendorModalTitle}>Select Vendor</Text>
              <TouchableOpacity onPress={() => setVendorModalVisible(false)}>
                <Feather name="x" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchBar}>
                <Feather name="search" size={18} color={Colors.textLight} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search vendor company..."
                    value={vendorSearch}
                    onChangeText={handleVendorSearch}
                    autoFocus
                />
            </View>

            {isVendorLoading ? (
                <ActivityIndicator style={{ padding: 20 }} color={Colors.primary} />
            ) : (
                <FlatList
                    data={vendors}
                    keyExtractor={(item, index) => item.vendor_id || item.id || index.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={styles.vendorOption}
                            onPress={() => selectVendor(item)}
                        >
                            <Text style={styles.vendorOptionName}>{item.company_name || item.vendor_company_name}</Text>
                            <Text style={styles.vendorOptionMeta}>{item.vendor_name || item.primary_mobile_no}</Text>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <Text style={styles.emptyListText}>No vendors found</Text>
                    }
                />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.65)",
  },
  countBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  countText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  listContent: { padding: 16 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
  },
  itemRef: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: Colors.white,
    padding: 8,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 14,
  },
  highlightCard: {
    backgroundColor: "#F0F7FF", // Light Blue
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#CCE3FD",
  },
  sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
  },
  l1Badge: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
  },
  l1BadgeText: {
      color: Colors.white,
      fontSize: 12,
      fontFamily: 'Inter_700Bold',
  },
  highlightTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  standardCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  textInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  textInputHighlight: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: "#CCE3FD",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: Colors.white,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  submitBtn: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
  },

  // Vendor Modal Styles
  vendorModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  vendorModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: "100%",
    maxHeight: "80%",
    padding: 20,
  },
  vendorModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  vendorModalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.background,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 48,
      marginBottom: 16,
  },
  searchInput: {
      flex: 1,
      marginLeft: 10,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: Colors.text,
  },
  vendorOption: {
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
  },
  vendorOptionName: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: Colors.text,
  },
  vendorOptionMeta: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: Colors.textSecondary,
      marginTop: 2,
  },
  emptyListText: {
      textAlign: 'center',
      padding: 20,
      color: Colors.textLight,
      fontFamily: 'Inter_400Regular',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 8,
  },
  searchInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 10,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    padding: 0,
  },
  vrsBanner: {
    backgroundColor: "#F0F7FF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#CCE5FF",
  },
  vrsBannerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  vrsBannerCol: {
    flex: 1,
  },
  vrsBannerLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  vrsBannerValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  vrsBannerDivider: {
    height: 1,
    backgroundColor: "#CCE5FF",
    marginVertical: 12,
  },
  vrsBannerInfo: {
    marginBottom: 12,
  },
  vrsBannerGrid: {
    flexDirection: "row",
    gap: 20,
  },
  vrsBannerItem: {
    flex: 1,
  },
});
