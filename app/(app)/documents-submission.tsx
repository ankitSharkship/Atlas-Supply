import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { getFirstMileImplantDisplay, editFirstMileImplant, FirstMileImplantData } from '@/lib/api-service';
import { getEwayBillDetails } from '@/lib/ewaybill-service';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function CalendarModal({
  visible,
  selectedDate,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedDate: Date | null;
  onSelect: (d: Date) => void;
  onClose: () => void;
}) {
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1,
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={mStyles.overlay} onPress={onClose}>
        <Pressable style={mStyles.calCard} onPress={() => {}}>
          <View style={mStyles.calHeader}>
            <Pressable onPress={() => setViewDate(new Date(year, month - 1, 1))} style={mStyles.calNav}>
              <Feather name="chevron-left" size={20} color={Colors.text} />
            </Pressable>
            <Text style={mStyles.calTitle}>{MONTHS[month]} {year}</Text>
            <Pressable onPress={() => setViewDate(new Date(year, month + 1, 1))} style={mStyles.calNav}>
              <Feather name="chevron-right" size={20} color={Colors.text} />
            </Pressable>
          </View>
          <View style={mStyles.calDayRow}>
            {DAYS.map((d) => (
              <Text key={d} style={mStyles.calDayLabel}>{d}</Text>
            ))}
          </View>
          <View style={mStyles.calGrid}>
            {cells.map((day, i) => {
              const isSelected = selectedDate && day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
              const isToday = day && day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              
              return (
                <Pressable
                  key={i}
                  style={[
                    mStyles.calCell,
                    day && isSelected ? mStyles.calCellSelected : undefined,
                    day && isToday && !isSelected ? mStyles.calCellToday : undefined,
                  ]}
                  onPress={() => { if (day) { onSelect(new Date(year, month, day)); onClose(); } }}
                  disabled={!day}
                >
                  {day ? (
                    <Text style={[mStyles.calCellText, isSelected ? mStyles.calCellTextSel : undefined, isToday && !isSelected ? { color: Colors.primary } : undefined]}>
                      {day}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function TimePickerModal({
  visible,
  selectedHour,
  selectedMinute,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedHour: number;
  selectedMinute: number;
  onSelect: (h: number, m: number) => void;
  onClose: () => void;
}) {
  const [hour, setHour] = useState(selectedHour);
  const [minute, setMinute] = useState(selectedMinute);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);
  const ITEM_HEIGHT = 48;

  useEffect(() => {
    if (visible) {
      setHour(selectedHour);
      setMinute(selectedMinute);
      setTimeout(() => {
        hourScrollRef.current?.scrollTo({ y: selectedHour * ITEM_HEIGHT, animated: false });
        minuteScrollRef.current?.scrollTo({ y: selectedMinute * ITEM_HEIGHT, animated: false });
      }, 50);
    }
  }, [visible, selectedHour, selectedMinute]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={mStyles.overlay} onPress={onClose}>
        <Pressable style={mStyles.timeCard} onPress={() => {}}>
          <Text style={mStyles.timeTitle}>Select Time</Text>
          <View style={mStyles.timeColumns}>
            <View style={mStyles.timeColumn}>
              <Text style={mStyles.timeColLabel}>Hour</Text>
              <ScrollView ref={hourScrollRef} style={mStyles.timeScroll} showsVerticalScrollIndicator={false}>
                {hours.map((h) => (
                  <Pressable
                    key={h}
                    style={[mStyles.timeItem, h === hour && mStyles.timeItemSelected]}
                    onPress={() => setHour(h)}
                  >
                    <Text style={[mStyles.timeItemText, h === hour && mStyles.timeItemTextSelected]}>
                      {String(h).padStart(2, '0')}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <Text style={mStyles.timeSeparator}>:</Text>
            <View style={mStyles.timeColumn}>
              <Text style={mStyles.timeColLabel}>Minute</Text>
              <ScrollView ref={minuteScrollRef} style={mStyles.timeScroll} showsVerticalScrollIndicator={false}>
                {minutes.map((m) => (
                  <Pressable
                    key={m}
                    style={[mStyles.timeItem, m === minute && mStyles.timeItemSelected]}
                    onPress={() => setMinute(m)}
                  >
                    <Text style={[mStyles.timeItemText, m === minute && mStyles.timeItemTextSelected]}>
                      {String(m).padStart(2, '0')}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
          <Pressable
            style={mStyles.timeConfirmBtn}
            onPress={() => { onSelect(hour, minute); onClose(); }}
          >
            <Text style={mStyles.timeConfirmText}>Confirm Time</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  calCard: { backgroundColor: Colors.card, borderRadius: 20, padding: 20, width: '100%', maxWidth: 340 },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  calNav: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  calTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  calDayRow: { flexDirection: 'row', marginBottom: 8 },
  calDayLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textLight },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  calCellSelected: { backgroundColor: Colors.primary },
  calCellToday: { backgroundColor: Colors.background },
  calCellText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text },
  calCellTextSel: { color: Colors.white, fontFamily: 'Inter_600SemiBold' },
  // Time Picker Styles
  timeCard: { backgroundColor: Colors.card, borderRadius: 24, padding: 24, width: '100%', maxWidth: 320 },
  timeTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 20, textAlign: 'center' },
  timeColumns: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 24 },
  timeColumn: { alignItems: 'center' },
  timeColLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginBottom: 10 },
  timeScroll: { height: 180, width: 60 },
  timeItem: { height: 44, width: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginBottom: 4 },
  mtimeItemSelected: { backgroundColor: Colors.primary },
  timeItemSelected: { backgroundColor: Colors.primary },
  timeItemText: { fontSize: 16, fontFamily: 'Inter_400Regular', color: Colors.text },
  timeItemTextSelected: { color: Colors.white, fontFamily: 'Inter_700Bold' },
  timeSeparator: { fontSize: 32, fontFamily: 'Inter_700Bold', color: Colors.border, paddingTop: 10 },
  timeConfirmBtn: { backgroundColor: Colors.primary, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  timeConfirmText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.white },
});

export default function DocumentsSubmissionScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [availableEntries, setAvailableEntries] = useState<FirstMileImplantData[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<FirstMileImplantData | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Form Fields
  const [vehicleNo, setVehicleNo] = useState('');
  const [rackHeight, setRackHeight] = useState('');
  const [loadedWeight, setLoadedWeight] = useState('');
  
  const [lorryReceiptInput, setLorryReceiptInput] = useState('');
  const [lorryReceipts, setLorryReceipts] = useState<string[]>([]);
  
  const [lrDate, setLrDate] = useState<Date | null>(null);
  const [lrHour, setLrHour] = useState(new Date().getHours());
  const [lrMinute, setLrMinute] = useState(new Date().getMinutes());
  const [showLrCalendar, setShowLrCalendar] = useState(false);
  const [showLrTimePicker, setShowLrTimePicker] = useState(false);
  const [lrTimeSet, setLrTimeSet] = useState(false);

  const [ewayBillInput, setEwayBillInput] = useState('');
  const [ewayBills, setEwayBills] = useState<string[]>([]);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingEway, setIsVerifyingEway] = useState(false);

  // Used to scroll the eway bill field into view when keyboard opens
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setSelectedEntry(null);
    try {
      const response = await getFirstMileImplantDisplay();
      // Documents Submission shows only fully loaded entries
      const dsEntries = response.first_mile_implant_data.filter(
        (e) => e.status === 'Vehicle Get Loaded'
      );
      setAvailableEntries(dsEntries);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch pending entries.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Re-fetch every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [fetchEntries])
  );

  useEffect(() => {
    if (selectedEntry) {
      setVehicleNo(selectedEntry.vehicle_number || selectedEntry.vehicle_no || '');
      setRackHeight(selectedEntry.height?.toString() || '');
      setLoadedWeight(selectedEntry.implant_actual_load_weight?.toString() || '');
      setLorryReceipts(selectedEntry.lr_assigned || []);
      console.log(selectedEntry.implant_eway_bills);
      
      
      // implant_eway_bills may be an array OR a comma-separated string depending on API version
      const rawEway = selectedEntry.implant_eway_bills;
      if (Array.isArray(rawEway)) {
        setEwayBills(rawEway.filter(Boolean));
      } else if (typeof rawEway === 'string' && rawEway) {
        setEwayBills(rawEway.split(',').filter(Boolean));
      } else {
        setEwayBills([]);
      }
      
      if (selectedEntry.lorry_receipt_date) {
        const d = new Date(selectedEntry.lorry_receipt_date);
        setLrDate(d);
        setLrHour(d.getHours());
        setLrMinute(d.getMinutes());
        setLrTimeSet(true);
      }
    }
  }, [selectedEntry]);

  const filteredEntries = availableEntries.filter((v) => {
    const q = vehicleSearch.toLowerCase();
    return (
      v.customer_name.toLowerCase().includes(q) ||
      v.vehicle_type.toLowerCase().includes(q) ||
      (v.enquiry_no && v.enquiry_no.toLowerCase().includes(q))
    );
  });

  const formatDateLabel = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;

  const formatTimeLabel = (h: number, m: number) =>
    `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  const addLr = () => {
    const trimmed = lorryReceiptInput.trim();
    if (!trimmed) return;
    if (lorryReceipts.includes(trimmed)) return;
    setLorryReceipts([...lorryReceipts, trimmed]);
    setLorryReceiptInput('');
  };

  /**
   * Verifies the eway bill number against the Whitebooks API before adding it.
   * Shows a loader in place of the add button while verifying.
   * On success: adds the EWB chip. On failure: shows error alert.
   */
  const addEway = async () => {
    const trimmed = ewayBillInput.trim();
    if (!trimmed) return;
    if (ewayBills.includes(trimmed)) {
      Alert.alert('Duplicate', `EWB ${trimmed} is already added.`);
      return;
    }

    setIsVerifyingEway(true);
    console.log(`[DS UI] Starting verification for EWB: ${trimmed}`);
    try {
      const details = await getEwayBillDetails(trimmed);

      // ── Vehicle Number Validation ─────────────────────────────────────────
      // Extract vehicle number from EWB (lives in VehiclListDetails[0].vehicleNo)
      const ewbVehicle = details.VehiclListDetails?.[0]?.vehicleNo ?? '';
      const entryVehicle = selectedEntry?.vehicle_no || selectedEntry?.vehicle_number || '';

      // Normalize: uppercase + strip all spaces
      const normalize = (s: string) => s.toUpperCase().replace(/\s+/g, '');
      const ewbNorm = normalize(ewbVehicle);
      const entryNorm = normalize(entryVehicle);

      console.log(`[DS UI] EWB vehicle: "${ewbVehicle}" (${ewbNorm}) | Entry vehicle: "${entryVehicle}" (${entryNorm})`);

      if (!ewbNorm) {
        Alert.alert('Unverifiable EWB', `EWB ${trimmed} has no vehicle number on record. Cannot verify.`);
        return;
      }

      if (ewbNorm !== entryNorm) {
        Alert.alert(
          'Vehicle Number Mismatch',
          `The vehicle on this EWB (${ewbVehicle}) does not match the selected entry's vehicle (${entryVehicle || 'not set'}).\n\nPlease verify and use the correct EWB number.`
        );
        return;
      }

      // All checks passed — add to list
      setEwayBills((prev) => [...prev, trimmed]);
      setEwayBillInput('');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert('Invalid EWB', error.message || `Could not verify EWB number ${trimmed}.`);
    } finally {
      setIsVerifyingEway(false);
    }
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert('Error', 'Camera permission required.'); return; }
      result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
    }

    if (!result.canceled) {
      setUploadedImage(result.assets[0].uri);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSubmit = async () => {
    if (!selectedEntry) { Alert.alert('Error', 'Please select an entry.'); return; }
    if (!vehicleNo.trim()) { Alert.alert('Error', 'Please enter vehicle number.'); return; }
    if (lorryReceipts.length === 0) { Alert.alert('Error', 'Please add at least one Lorry Receipt.'); return; }
    if (!lrDate || !lrTimeSet) { Alert.alert('Error', 'Please select Lorry Receipt date & time.'); return; }
    if (!loadedWeight.trim()) { Alert.alert('Error', 'Please enter actual load weight.'); return; }

    // Format LR Date using LOCAL components — toISOString() converts to UTC
    // which would send the wrong date for IST users (UTC+5:30).
    const lrYyyy = lrDate.getFullYear();
    const lrMm = String(lrDate.getMonth() + 1).padStart(2, '0');
    const lrDd = String(lrDate.getDate()).padStart(2, '0');
    const lrDateStr = `${lrYyyy}-${lrMm}-${lrDd}`;
    const lrTimeStr = `${String(lrHour).padStart(2, '0')}:${String(lrMinute).padStart(2, '0')}`;
    const formattedLrDateTime = `${lrDateStr} ${lrTimeStr}`;

    const body: Record<string, any> = {
      enquiry_no: selectedEntry.enquiry_no,
      vehicle_no: vehicleNo.trim(),
      height: parseFloat(rackHeight) || 0,
      lorry_receipts: lorryReceipts,
      lorry_receipt_date: formattedLrDateTime,
      implant_actual_load_weight: parseFloat(loadedWeight) || 0,
      implant_eway_bills: ewayBills,
    };

    // Only include document_upload if the user actually selected an image
    if (uploadedImage) {
      body.document_upload = uploadedImage;
    }

    setIsSubmitting(true);
    try {
      const res = await editFirstMileImplant(body);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', res.message || 'Updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.white} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Documents Submission</Text>
          <Text style={styles.headerSubtitle}>Submit shipment and vehicle details</Text>
        </View>
        <View style={styles.headerIconCircle}>
          <Feather name="file-text" size={22} color={Colors.primary} />
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Select Entry</Text>
              <Pressable
                style={[styles.selectBtn, selectedEntry && styles.selectBtnActive]}
                onPress={() => setShowVehicleModal(true)}
              >
                {selectedEntry ? (
                  <View style={styles.selectRow}>
                    <View style={styles.selectBtnIconBg}>
                      <MaterialCommunityIcons name="truck" size={18} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectBtnMain}>{selectedEntry.customer_name}</Text>
                      <Text style={styles.selectBtnSub}>{selectedEntry.vehicle_type}</Text>
                    </View>
                    <Feather name="chevron-down" size={18} color={Colors.textLight} />
                  </View>
                ) : (
                  <View style={styles.selectRow}>
                    <Feather name="search" size={18} color={Colors.textLight} />
                    <Text style={styles.placeholderText}>Search or select entry</Text>
                    <Feather name="chevron-down" size={18} color={Colors.textLight} />
                  </View>
                )}
              </Pressable>
            </View>

            {selectedEntry && (
              <View style={styles.formCard}>
                
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Vehicle Number</Text>
                  <View style={styles.formInput}>
                    <MaterialCommunityIcons name="license" size={16} color={Colors.textLight} />
                    <TextInput
                      style={styles.formTextInput}
                      placeholder="e.g. UP53CU6715"
                      placeholderTextColor={Colors.textLight}
                      value={vehicleNo}
                      onChangeText={setVehicleNo}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Rack Height</Text>
                  <View style={styles.formInput}>
                    <MaterialCommunityIcons name="ruler" size={16} color={Colors.textLight} />
                    <TextInput
                      style={styles.formTextInput}
                      placeholder="Enter height"
                      placeholderTextColor={Colors.textLight}
                      value={rackHeight}
                      onChangeText={setRackHeight}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Lorry Receipts (Add Multiple)</Text>
                  <View style={styles.inputActionRow}>
                    <TextInput
                      style={[styles.formTextInput, styles.wrappedInput]}
                      placeholder="Enter LR Number"
                      placeholderTextColor={Colors.textLight}
                      value={lorryReceiptInput}
                      onChangeText={setLorryReceiptInput}
                      onSubmitEditing={addLr}
                    />
                    <Pressable style={styles.smallAddBtn} onPress={addLr}>
                      <Feather name="plus" size={18} color={Colors.white} />
                    </Pressable>
                  </View>
                  <View style={styles.chipRow}>
                    {lorryReceipts.map(lr => (
                      <View key={lr} style={styles.chip}>
                        <Text style={styles.chipText}>{lr}</Text>
                        <Pressable onPress={() => setLorryReceipts(lorryReceipts.filter(x => x !== lr))}>
                          <Feather name="x" size={14} color={Colors.textSecondary} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>LR Date & Time</Text>
                  <View style={styles.pickerRow}>
                    <Pressable style={[styles.formInput, { flex: 1 }]} onPress={() => setShowLrCalendar(true)}>
                      <Feather name="calendar" size={14} color={Colors.textLight} />
                      <Text style={styles.pickerValueText}>{lrDate ? formatDateLabel(lrDate) : 'Date'}</Text>
                    </Pressable>
                    <Pressable style={[styles.formInput, { flex: 1 }]} onPress={() => setShowLrTimePicker(true)}>
                      <Feather name="clock" size={14} color={Colors.textLight} />
                      <Text style={styles.pickerValueText}>{lrTimeSet ? formatTimeLabel(lrHour, lrMinute) : 'Time'}</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Actual Load Weight (MT)</Text>
                  <View style={styles.formInput}>
                    <MaterialCommunityIcons name="weight-kilogram" size={16} color={Colors.textLight} />
                    <TextInput
                      style={styles.formTextInput}
                      placeholder="Enter weight"
                      placeholderTextColor={Colors.textLight}
                      value={loadedWeight}
                      onChangeText={setLoadedWeight}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Eway Bills (Add Multiple)</Text>
                  <View style={styles.inputActionRow}>
                    <TextInput
                      style={[styles.formTextInput, styles.wrappedInput]}
                      placeholder="Enter Eway Bill Number"
                      placeholderTextColor={Colors.textLight}
                      value={ewayBillInput}
                      onChangeText={setEwayBillInput}
                      onSubmitEditing={addEway}
                      keyboardType="numeric"
                      editable={!isVerifyingEway}
                      onFocus={() => {
                        // Scroll to bottom so the eway bill field isn't hidden behind the keyboard
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 150);
                      }}
                    />
                    <Pressable
                      style={[styles.smallAddBtn, isVerifyingEway && { backgroundColor: Colors.primary }]}
                      onPress={addEway}
                      disabled={isVerifyingEway}
                    >
                      {isVerifyingEway ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <Feather name="plus" size={18} color={Colors.white} />
                      )}
                    </Pressable>
                  </View>
                  <View style={styles.chipRow}>
                    {ewayBills.map(bill => (
                      <View key={bill} style={styles.chip}>
                        <Text style={styles.chipText}>{bill}</Text>
                        <Pressable onPress={() => setEwayBills(ewayBills.filter(x => x !== bill))}>
                          <Feather name="x" size={14} color={Colors.textSecondary} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.formField}>
                   <Text style={styles.formLabel}>Document Upload (Optional)</Text>
                   <View style={styles.uploadPreview}>
                      {uploadedImage ? (
                        <View style={styles.imageBox}>
                           <Image source={{ uri: uploadedImage }} style={styles.image} />
                           <Pressable style={styles.removeImg} onPress={() => setUploadedImage(null)}>
                              <Feather name="trash-2" size={14} color={Colors.white} />
                           </Pressable>
                        </View>
                      ) : (
                        <View style={styles.uploadBtns}>
                           <Pressable style={styles.pickerSubBtn} onPress={() => pickImage('camera')}>
                              <Feather name="camera" size={18} color={Colors.primary} />
                              <Text style={styles.pickerSubText}>Camera</Text>
                           </Pressable>
                           <Pressable style={styles.pickerSubBtn} onPress={() => pickImage('gallery')}>
                              <Feather name="image" size={18} color={Colors.primary} />
                              <Text style={styles.pickerSubText}>Gallery</Text>
                           </Pressable>
                        </View>
                      )}
                   </View>
                </View>

              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                (!selectedEntry || isSubmitting || isVerifyingEway) && { opacity: 0.6 }
              ]}
              onPress={handleSubmit}
              disabled={!selectedEntry || isSubmitting || isVerifyingEway}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Feather name="send" size={18} color={Colors.white} />
                  <Text style={styles.submitBtnText}>Submit Documents</Text>
                </>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showVehicleModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <View style={styles.vModal}>
          <View style={styles.vModalHeader}>
            <Text style={styles.vModalTitle}>Select Entry</Text>
            <Pressable onPress={() => setShowVehicleModal(false)} style={styles.closeBtn}>
              <Feather name="x" size={22} color={Colors.text} />
            </Pressable>
          </View>
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color={Colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by customer, vehicle type..."
              placeholderTextColor={Colors.textLight}
              value={vehicleSearch}
              onChangeText={setVehicleSearch}
              autoCapitalize="none"
            />
          </View>
          <FlatList
            data={filteredEntries}
            keyExtractor={(item, index) => item.enquiry_no || index.toString()}
            contentContainerStyle={{ paddingBottom: 32 }}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            renderItem={({ item }) => {
              const isSelected = selectedEntry?.enquiry_no === item.enquiry_no;
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.vItem,
                    pressed && { backgroundColor: Colors.background },
                    isSelected && styles.vItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedEntry(item);
                    setShowVehicleModal(false);
                    setVehicleSearch('');
                  }}
                >
                  <View style={styles.vItemTopRow}>
                    <View style={[styles.vItemIcon, isSelected && { backgroundColor: Colors.primary }]}>
                      <MaterialCommunityIcons
                        name="truck-delivery"
                        size={18}
                        color={isSelected ? Colors.white : Colors.primary}
                      />
                    </View>
                    <Text style={styles.vItemEnquiry}>{item.vehicle_no || item.vehicle_number}</Text>
                    {isSelected && (
                      <Feather name="check-circle" size={18} color={Colors.success} />
                    )}
                  </View>
                  <View style={styles.vInfoPills}>
                    <View style={styles.vInfoPill}>
                      <Feather name="briefcase" size={11} color={Colors.textSecondary} />
                      <Text style={styles.vInfoPillText} numberOfLines={1}>{item.customer_name}</Text>
                    </View>
                    <View style={styles.vInfoPillRoute}>
                      <Feather name="map-pin" size={11} color={Colors.success} />
                      <Text style={styles.vInfoPillRouteText} numberOfLines={1}>{item.from_location}</Text>
                      <Feather name="arrow-right" size={11} color={Colors.textLight} />
                      <Feather name="map-pin" size={11} color={Colors.error} />
                      <Text style={styles.vInfoPillRouteText} numberOfLines={1}>{item.to_location}</Text>
                    </View>
                    {(item.enquiry_no) && (
                      <View style={styles.vInfoPill}>
                        <MaterialCommunityIcons name="truck" size={11} color={Colors.textSecondary} />
                        <Text style={styles.vInfoPillText}>{item.enquiry_no} </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>

      <CalendarModal
        visible={showLrCalendar}
        selectedDate={lrDate}
        onSelect={setLrDate}
        onClose={() => setShowLrCalendar(false)}
      />

      <TimePickerModal
        visible={showLrTimePicker}
        selectedHour={lrHour}
        selectedMinute={lrMinute}
        onSelect={(h, m) => {
          setLrHour(h);
          setLrMinute(m);
          setLrTimeSet(true);
        }}
        onClose={() => setShowLrTimePicker(false)}
      />
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.white },
  headerSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.65)' },
  headerIconCircle: {
    marginLeft: 'auto', width: 42, height: 42, borderRadius: 12,
    backgroundColor: "#EBF1FF", alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  selectBtn: {
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border, padding: 14,
  },
  selectBtnActive: { borderColor: Colors.primary },
  selectRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectBtnIconBg: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#EBF1FF', alignItems: 'center', justifyContent: 'center',
  },
  selectBtnMain: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  selectBtnSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  placeholderText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textLight },
  
  formCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    gap: 16, borderWidth: 1, borderColor: Colors.border,
  },
  formField: { gap: 6 },
  formLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  formInput: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.background, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 12, height: 48,
  },
  formTextInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text },
  
  inputActionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  wrappedInput: { height: 48, backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 12 },
  smallAddBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EBF1FF', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  chipText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.primary },
  
  pickerRow: { flexDirection: 'row', gap: 10 },
  pickerValueText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text, flex: 1 },
  
  uploadPreview: { marginTop: 4 },
  uploadBtns: { flexDirection: 'row', gap: 12 },
  pickerSubBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed' },
  pickerSubText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.primary },
  imageBox: { width: '100%', height: 160, borderRadius: 12, overflow: 'hidden', backgroundColor: Colors.background, position: 'relative' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeImg: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,59,48,0.8)', alignItems: 'center', justifyContent: 'center' },

  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 16, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: 8, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  submitBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.white },
  
  vModal: { flex: 1, backgroundColor: Colors.background },
  vModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 24, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  vModalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text },
  closeBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, height: 46 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text },
  // New card-style list item
  vItem: { flexDirection: 'column', padding: 14, backgroundColor: Colors.card, gap: 8 },
  vItemSelected: { backgroundColor: '#EBF1FF' },
  vItemIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#EBF1FF', alignItems: 'center', justifyContent: 'center' },
  vItemTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vItemEnquiry: { flex: 1, fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.primary },
  vInfoPills: { flexDirection: 'column', gap: 5, paddingLeft: 44 },
  vInfoPill: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  vInfoPillText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, flex: 1 },
  vInfoPillRoute: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'nowrap' },
  vInfoPillRouteText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, flexShrink: 1 },
  sep: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },
});
