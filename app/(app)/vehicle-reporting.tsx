import React, { useState, useCallback, useRef, useEffect } from 'react';
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
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { getFirstMileImplantDisplay, editFirstMileImplant, FirstMileImplantData } from '@/lib/api-service';

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

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const isSelected = (d: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === d &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  const isToday = (d: number) => {
    const t = new Date();
    return t.getDate() === d && t.getMonth() === month && t.getFullYear() === year;
  };

  const isFuture = (d: number) => {
    const t = new Date();
    t.setHours(23, 59, 59, 999);
    const cellDate = new Date(year, month, d);
    return cellDate > t;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.calendarCard} onPress={() => {}}>
          <View style={styles.calendarHeader}>
            <Pressable onPress={prevMonth} style={styles.calNavBtn}>
              <Feather name="chevron-left" size={20} color={Colors.text} />
            </Pressable>
            <Text style={styles.calMonthYear}>{MONTHS[month]} {year}</Text>
            <Pressable onPress={nextMonth} style={styles.calNavBtn}>
              <Feather name="chevron-right" size={20} color={Colors.text} />
            </Pressable>
          </View>
          <View style={styles.calDayRow}>
            {DAYS.map((d) => (
              <Text key={d} style={styles.calDayLabel}>{d}</Text>
            ))}
          </View>
          <View style={styles.calGrid}>
            {cells.map((day, i) => {
               const future = day ? isFuture(day) : false;
               return (
                <Pressable
                  key={i}
                  style={[
                    styles.calCell,
                    day && isSelected(day) ? styles.calCellSelected : undefined,
                    day && isToday(day) && !isSelected(day) ? styles.calCellToday : undefined,
                    future ? { opacity: 0.3 } : undefined,
                  ]}
                  onPress={() => {
                    if (day && !future) {
                      onSelect(new Date(year, month, day));
                      onClose();
                    }
                  }}
                  disabled={!day || future}
                >
                  {day ? (
                    <Text
                      style={[
                        styles.calCellText,
                        isSelected(day) && styles.calCellTextSelected,
                        isToday(day) && !isSelected(day) && { color: Colors.primary },
                      ]}
                    >
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
  selectedDate,
}: {
  visible: boolean;
  selectedHour: number;
  selectedMinute: number;
  onSelect: (h: number, m: number) => void;
  onClose: () => void;
  selectedDate: Date | null;
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

  const isFutureTime = (h: number, m: number) => {
    if (!selectedDate) return false;
    const now = new Date();
    const probe = new Date(selectedDate);
    probe.setHours(h, m, 0, 0);
    return probe > now;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.timeCard} onPress={() => {}}>
          <Text style={styles.timeTitle}>Select Time</Text>
          <View style={styles.timeColumns}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeColLabel}>Hour</Text>
              <ScrollView ref={hourScrollRef} style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                {hours.map((h) => {
                  const future = isFutureTime(h, minute);
                  return (
                    <Pressable
                      key={h}
                      style={[styles.timeItem, h === hour && styles.timeItemSelected, future && { opacity: 0.3 }]}
                      onPress={() => { if (!isFutureTime(h, minute)) setHour(h); }}
                      disabled={false} // Allow selecting, validate on confirm
                    >
                      <Text style={[styles.timeItemText, h === hour && styles.timeItemTextSelected]}>
                        {String(h).padStart(2, '0')}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.timeColumn}>
              <Text style={styles.timeColLabel}>Minute</Text>
              <ScrollView ref={minuteScrollRef} style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                {minutes.map((m) => {
                  const future = isFutureTime(hour, m);
                  return (
                    <Pressable
                      key={m}
                      style={[styles.timeItem, m === minute && styles.timeItemSelected, future && { opacity: 0.3 }]}
                      onPress={() => { if (!isFutureTime(hour, m)) setMinute(m); }}
                    >
                      <Text style={[styles.timeItemText, m === minute && styles.timeItemTextSelected]}>
                        {String(m).padStart(2, '0')}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
          <Pressable
            style={styles.timeConfirmBtn}
            onPress={() => {
              if (isFutureTime(hour, minute)) {
                Alert.alert('Invalid Time', 'Reporting time cannot be in the future.');
                return;
              }
              onSelect(hour, minute);
              onClose();
            }}
          >
            <Text style={styles.timeConfirmText}>Confirm Time</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function VehicleReportingScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [availableEntries, setAvailableEntries] = useState<FirstMileImplantData[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<FirstMileImplantData | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [reportedDate, setReportedDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [reportedHour, setReportedHour] = useState(new Date().getHours());
  const [reportedMinute, setReportedMinute] = useState(new Date().getMinutes());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeSet, setTimeSet] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setSelectedEntry(null);
    try {
      const response = await getFirstMileImplantDisplay();
      // Vehicle Reporting shows entries NOT yet loaded (exclude 'Vehicle Get Loaded')
      const vrEntries = response.first_mile_implant_data.filter(
        (e) => e.status !== 'Vehicle Get Loaded'
      );
      setAvailableEntries(vrEntries);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch vehicle reporting data.');
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

  const formatTimeLabel = () =>
    `${String(reportedHour).padStart(2, '0')}:${String(reportedMinute).padStart(2, '0')}`;

  const handleSubmit = async () => {
    if (!selectedEntry) {
      Alert.alert('Missing Info', 'Please select a vehicle entry.');
      return;
    }
    if (!reportedDate) {
      Alert.alert('Missing Info', 'Please select the reported date.');
      return;
    }
    if (!timeSet) {
      Alert.alert('Missing Info', 'Please select the reported time.');
      return;
    }

    // Format datetime using LOCAL date components — toISOString() would give UTC
    // which shifts the date back by 5:30h in IST and produces the wrong day.
    const yyyy = reportedDate.getFullYear();
    const mm = String(reportedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(reportedDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const timeStr = `${String(reportedHour).padStart(2, '0')}:${String(reportedMinute).padStart(2, '0')}`;
    const formattedDateTime = `${dateStr} ${timeStr}`;
    

    setIsSubmitting(true);
    try {
      console.log(selectedEntry.enquiry_no);
      console.log(formattedDateTime);
      
      const reaponse = await editFirstMileImplant({
        enquiry_no: selectedEntry.enquiry_no!,
        vehicle_reporting_datetime: formattedDateTime,
      });
      console.log(reaponse);
      
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `Vehicle reporting for enquiry ${selectedEntry.enquiry_no} submitted successfully.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.white} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Pending To Report</Text>
          <Text style={styles.headerSubtitle}>Mark vehicle arrival at gate</Text>
        </View>
        <View style={styles.headerIconCircle}>
          <MaterialCommunityIcons name="truck-delivery" size={22} color={Colors.accent} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Select Vehicle Entry</Text>
              <Pressable
                style={[styles.selectBtn, selectedEntry && styles.selectBtnActive]}
                onPress={() => setShowVehicleModal(true)}
              >
                {selectedEntry ? (
                  <View style={styles.selectBtnContent}>
                    <View style={styles.selectBtnIcon}>
                      <MaterialCommunityIcons name="truck" size={18} color={Colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectBtnMain}>{selectedEntry.customer_name}</Text>
                      <Text style={styles.selectBtnSub}>{selectedEntry.vehicle_type}</Text>
                    </View>
                    <Feather name="chevron-down" size={18} color={Colors.textLight} />
                  </View>
                ) : (
                  <View style={styles.selectBtnContent}>
                    <Feather name="search" size={18} color={Colors.textLight} />
                    <Text style={styles.selectBtnPlaceholder}>Search or select vehicle entry</Text>
                    <Feather name="chevron-down" size={18} color={Colors.textLight} />
                  </View>
                )}
              </Pressable>
            </View>

            {selectedEntry && (
              <View style={styles.detailCard}>
                <View style={styles.detailCardHeader}>
                  <MaterialCommunityIcons name="information" size={18} color={Colors.primary} />
                  <Text style={styles.detailCardTitle}>Entry Details</Text>
                </View>
                <View style={styles.detailGrid}>
                  {[
                    { label: 'Enquiry No', value: selectedEntry.enquiry_no },
                    { label: 'Customer', value: selectedEntry.customer_name },
                    { label: 'Vehicle Type', value: selectedEntry.vehicle_type },
                    { label: 'From Location', value: selectedEntry.from_location },
                    { label: 'To Location', value: selectedEntry.to_location },
                    { label: 'Required On', value: new Date(selectedEntry.required_on_date).toLocaleDateString() },
                    { label: 'LR Count', value: selectedEntry.no_of_lr_requested?.toString() || '0' },
                  ].map((item) => (
                    <View key={item.label} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{item.label}</Text>
                      <Text style={styles.detailValue}>{item.value || '-'}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Reporting Details</Text>
              <View style={styles.pickerRow}>
                <View style={[styles.pickerField, { flex: 1 }]}>
                  <Text style={styles.pickerLabel}>Reported Date</Text>
                  <Pressable
                    style={[styles.pickerBtn, reportedDate && styles.pickerBtnFilled]}
                    onPress={() => setShowCalendar(true)}
                  >
                    <Feather
                      name="calendar"
                      size={16}
                      color={reportedDate ? Colors.primary : Colors.textLight}
                    />
                    <Text style={[styles.pickerBtnText, reportedDate && styles.pickerBtnTextFilled]}>
                      {reportedDate ? formatDateLabel(reportedDate) : 'Select date'}
                    </Text>
                  </Pressable>
                </View>
                <View style={[styles.pickerField, { flex: 1 }]}>
                  <Text style={styles.pickerLabel}>Reported Time</Text>
                  <Pressable
                    style={[styles.pickerBtn, timeSet && styles.pickerBtnFilled]}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Feather
                      name="clock"
                      size={16}
                      color={timeSet ? Colors.primary : Colors.textLight}
                    />
                    <Text style={[styles.pickerBtnText, timeSet && styles.pickerBtnTextFilled]}>
                      {timeSet ? formatTimeLabel() : 'Select time'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                isSubmitting && { opacity: 0.7 },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle" size={20} color={Colors.white} />
                  <Text style={styles.submitBtnText}>Submit Reporting</Text>
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
        <View style={styles.vehicleModal}>
          <View style={styles.vehicleModalHeader}>
            <Text style={styles.vehicleModalTitle}>Select Entry</Text>
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
          {availableEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="truck-remove" size={48} color={Colors.border} />
              <Text style={styles.emptyStateTitle}>No entries found</Text>
              <Text style={styles.emptyStateText}>There are no vehicles currently reporting.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredEntries}
              keyExtractor={(item, index) => item.enquiry_no || index.toString()}
              contentContainerStyle={{ paddingBottom: 32 }}
              ItemSeparatorComponent={() => <View style={styles.vehicleItemSep} />}
              renderItem={({ item }) => {
                const isSelected = selectedEntry?.enquiry_no === item.enquiry_no;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.vehicleItem,
                      pressed && { backgroundColor: Colors.background },
                      isSelected && styles.vehicleItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedEntry(item);
                      setShowVehicleModal(false);
                      setVehicleSearch('');
                    }}
                  >
                    <View style={styles.vehicleItemTopRow}>
                      <View style={[styles.vehicleIconCircle, isSelected && { backgroundColor: Colors.primary }]}>
                        <MaterialCommunityIcons
                          name="truck-fast"
                          size={18}
                          color={isSelected ? Colors.white : Colors.accent}
                        />
                      </View>
                      <Text style={styles.vehicleItemEnquiry}> {item.vehicle_no || item.vehicle_number}</Text>
                      {isSelected && (
                        <Feather name="check-circle" size={18} color={Colors.success} />
                      )}
                    </View>
                    <View style={styles.vehicleInfoPills}>
                      <View style={styles.infoPill}>
                        <Feather name="briefcase" size={11} color={Colors.textSecondary} />
                        <Text style={styles.infoPillText} numberOfLines={1}>{item.customer_name}</Text>
                      </View>
                      <View style={styles.infoPillRoute}>
                        <Feather name="map-pin" size={11} color={Colors.success} />
                        <Text style={styles.infoPillRouteText} numberOfLines={1}>
                          {item.from_location}
                        </Text>
                        <Feather name="arrow-right" size={11} color={Colors.textLight} />
                        <Feather name="map-pin" size={11} color={Colors.error} />
                        <Text style={styles.infoPillRouteText} numberOfLines={1}>
                          {item.to_location}
                        </Text>
                      </View>
                        {(item.enquiry_no) && (<View style={styles.infoPill}>
                          {/* <MaterialCommunityIcons name="truck" size={11} color={Colors.textSecondary} /> */}
                          <Text style={styles.infoPillText}>
                           {item.enquiry_no}
                          </Text>
                        </View>)}
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </Modal>

      <CalendarModal
        visible={showCalendar}
        selectedDate={reportedDate}
        onSelect={setReportedDate}
        onClose={() => setShowCalendar(false)}
      />

      <TimePickerModal
        visible={showTimePicker}
        selectedHour={reportedHour}
        selectedMinute={reportedMinute}
        selectedDate={reportedDate}
        onSelect={(h, m) => {
          setReportedHour(h);
          setReportedMinute(m);
          setTimeSet(true);
        }}
        onClose={() => setShowTimePicker(false)}
      />
    </View>
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
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.65)',
  },
  headerIconCircle: {
    marginLeft: 'auto',
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFF3E8",
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  selectBtn: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 14,
  },
  selectBtnActive: {
    borderColor: Colors.accent,
  },
  selectBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectBtnIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBtnMain: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  selectBtnSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  selectBtnPlaceholder: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textLight,
  },
  detailCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  detailCardTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  detailGrid: { gap: 10 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerField: { gap: 6 },
  pickerLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 12,
  },
  pickerBtnFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#EBF1FF',
  },
  pickerBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textLight,
    flex: 1,
  },
  pickerBtnTextFilled: {
    color: Colors.primary,
    fontFamily: 'Inter_500Medium',
  },
  submitBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
  },
  vehicleModal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  vehicleModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 24,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  vehicleModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  vehicleItemSep: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  vehicleItem: {
    flexDirection: 'column',
    padding: 14,
    backgroundColor: Colors.card,
    gap: 8,
  },
  vehicleItemSelected: {
    backgroundColor: '#EBF1FF',
  },
  vehicleIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vehicleItemEnquiry: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },
  vehicleInfoPills: {
    flexDirection: 'column',
    gap: 5,
    paddingLeft: 44,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoPillText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    flex: 1,
  },
  infoPillRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'nowrap',
  },
  infoPillRouteText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  calendarCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calMonthYear: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  calDayRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: 8,
  },
  calDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textLight,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  calCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  calCellSelected: {
    backgroundColor: Colors.primary,
  },
  calCellToday: {
    backgroundColor: '#EBF1FF',
  },
  calCellText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
  },
  calCellTextSelected: {
    color: Colors.white,
    fontFamily: 'Inter_700Bold',
  },
  timeCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  timeTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  timeColumns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  timeColumn: {
    alignItems: 'center',
  },
  timeColLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  timeScroll: {
    height: 200,
    width: 60,
  },
  timeItem: {
    height: 44,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginBottom: 4,
  },
  timeItemSelected: {
    backgroundColor: Colors.primary,
  },
  timeItemText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
  },
  timeItemTextSelected: {
    color: Colors.white,
    fontFamily: 'Inter_700Bold',
  },
  timeSeparator: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: Colors.border,
    paddingTop: 20,
  },
  timeConfirmBtn: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeConfirmText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
  },
});
