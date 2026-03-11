import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import {
  getLastMileOpodDisplay,
  editLastMileOpod,
  LastMileOpodData,
} from '@/lib/api-service';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// ─── Calendar Modal ──────────────────────────────────────────────────────────

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
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        <Pressable style={modalStyles.calCard} onPress={() => {}}>
          <View style={modalStyles.calHeader}>
            <Pressable onPress={() => setViewDate(new Date(year, month - 1, 1))} style={modalStyles.calNav}>
              <Feather name="chevron-left" size={20} color={Colors.text} />
            </Pressable>
            <Text style={modalStyles.calTitle}>{MONTHS[month]} {year}</Text>
            <Pressable onPress={() => setViewDate(new Date(year, month + 1, 1))} style={modalStyles.calNav}>
              <Feather name="chevron-right" size={20} color={Colors.text} />
            </Pressable>
          </View>
          <View style={modalStyles.calDayRow}>
            {DAYS.map((d) => (
              <Text key={d} style={modalStyles.calDayLabel}>{d}</Text>
            ))}
          </View>
          <View style={modalStyles.calGrid}>
            {cells.map((day, i) => {
              const sel = selectedDate && day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
              const today = day && day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              return (
                <Pressable
                  key={i}
                  style={[modalStyles.calCell, sel ? modalStyles.calCellSel : undefined, today && !sel ? modalStyles.calCellToday : undefined]}
                  onPress={() => { if (day) { onSelect(new Date(year, month, day)); onClose(); } }}
                  disabled={!day}
                >
                  {day ? (
                    <Text style={[modalStyles.calCellText, sel ? modalStyles.calCellTextSel : undefined, today && !sel ? { color: Colors.primary } : undefined]}>
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

// ─── Time Picker Modal ───────────────────────────────────────────────────────

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
  const ITEM_HEIGHT = 48; // 44 height + 4 marginBottom

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
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        <Pressable style={modalStyles.timeCard} onPress={() => {}}>
          <Text style={modalStyles.timeTitle}>Select Time</Text>
          <View style={modalStyles.timeColumns}>
            <View style={modalStyles.timeColumn}>
              <Text style={modalStyles.timeColLabel}>Hour</Text>
              <ScrollView ref={hourScrollRef} style={modalStyles.timeScroll} showsVerticalScrollIndicator={false}>
                {hours.map((h) => (
                  <Pressable key={h} style={[modalStyles.timeItem, h === hour && modalStyles.timeItemSel]} onPress={() => setHour(h)}>
                    <Text style={[modalStyles.timeItemText, h === hour && modalStyles.timeItemTextSel]}>{String(h).padStart(2, '0')}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <Text style={modalStyles.timeSep}>:</Text>
            <View style={modalStyles.timeColumn}>
              <Text style={modalStyles.timeColLabel}>Minute</Text>
              <ScrollView ref={minuteScrollRef} style={modalStyles.timeScroll} showsVerticalScrollIndicator={false}>
                {minutes.map((m) => (
                  <Pressable key={m} style={[modalStyles.timeItem, m === minute && modalStyles.timeItemSel]} onPress={() => setMinute(m)}>
                    <Text style={[modalStyles.timeItemText, m === minute && modalStyles.timeItemTextSel]}>{String(m).padStart(2, '0')}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
          <Pressable style={modalStyles.timeConfirmBtn} onPress={() => { onSelect(hour, minute); onClose(); }}>
            <Text style={modalStyles.timeConfirmText}>Confirm Time</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  calCard: { backgroundColor: Colors.card, borderRadius: 20, padding: 20, width: '100%', maxWidth: 340 },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  calNav: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  calTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  calDayRow: { flexDirection: 'row', marginBottom: 8 },
  calDayLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textLight },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  calCellSel: { backgroundColor: Colors.primary },
  calCellToday: { backgroundColor: Colors.background },
  calCellText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text },
  calCellTextSel: { color: Colors.white, fontFamily: 'Inter_600SemiBold' },
  timeCard: { backgroundColor: Colors.card, borderRadius: 24, padding: 24, width: '100%', maxWidth: 320 },
  timeTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 20, textAlign: 'center' },
  timeColumns: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 24 },
  timeColumn: { alignItems: 'center' },
  timeColLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginBottom: 10 },
  timeScroll: { height: 180, width: 60 },
  timeItem: { height: 44, width: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 12, marginBottom: 4 },
  timeItemSel: { backgroundColor: Colors.primary },
  timeItemText: { fontSize: 16, fontFamily: 'Inter_400Regular', color: Colors.text },
  timeItemTextSel: { color: Colors.white, fontFamily: 'Inter_700Bold' },
  timeSep: { fontSize: 32, fontFamily: 'Inter_700Bold', color: Colors.border, paddingTop: 10 },
  timeConfirmBtn: { backgroundColor: Colors.primary, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  timeConfirmText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.white },
});

// ─── HPOD Edit Form Modal ────────────────────────────────────────────────────

function HpodEditModal({
  visible,
  task,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  task: LastMileOpodData | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [courierName, setCourierName] = useState('');
  const [docketNo, setDocketNo] = useState('');

  const [dispatchDate, setDispatchDate] = useState<Date | null>(null);
  const [dispatchHour, setDispatchHour] = useState(new Date().getHours());
  const [dispatchMinute, setDispatchMinute] = useState(new Date().getMinutes());
  const [showCal, setShowCal] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [timeSet, setTimeSet] = useState(false);

  // Per-LR file uploads: { [lrNumber]: uri }
  const [lrFiles, setLrFiles] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setCourierName(task.courier_name || '');
      setDocketNo(task.docket_no || '');
      setLrFiles({});
      setDispatchDate(null);
      setTimeSet(false);
      setDispatchHour(new Date().getHours());
      setDispatchMinute(new Date().getMinutes());

      if (task.courier_datetime) {
        const d = new Date(task.courier_datetime);
        setDispatchDate(d);
        setDispatchHour(d.getHours());
        setDispatchMinute(d.getMinutes());
        setTimeSet(true);
      }
    }
  }, [task]);

  const captureLrPhoto = async (lrNumber: string) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Camera access is required to capture HPOD documents.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      setLrFiles((prev) => ({ ...prev, [lrNumber]: result.assets[0].uri }));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const removeLrPhoto = (lrNumber: string) => {
    setLrFiles((prev) => {
      const next = { ...prev };
      delete next[lrNumber];
      return next;
    });
  };

  const formatDateLabel = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;

  const formatTimeLabel = () =>
    `${String(dispatchHour).padStart(2, '0')}:${String(dispatchMinute).padStart(2, '0')}`;

  const handleSubmit = async () => {
    if (!task) return;
    if (!courierName.trim()) { Alert.alert('Error', 'Please enter courier partner name.'); return; }
    if (!docketNo.trim()) { Alert.alert('Error', 'Please enter docket number.'); return; }
    if (!dispatchDate || !timeSet) { Alert.alert('Error', 'Please select dispatch date & time.'); return; }

    // Check all LRs have photos
    const missingLrs = task.lorry_receipts.filter((lr) => !lrFiles[lr]);
    // if (missingLrs.length > 0) {
    //   Alert.alert('Missing Documents', `Please capture photos for: ${missingLrs.join(', ')}`);
    //   return;
    // }

    const yyyy = dispatchDate.getFullYear();
    const mm = String(dispatchDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dispatchDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const timeStr = `${String(dispatchHour).padStart(2, '0')}:${String(dispatchMinute).padStart(2, '0')}:00`;
    const courierDatetime = `${dateStr} ${timeStr}`;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('enquiry_no', task.enquiry_no);
      formData.append('courier_name', courierName.trim());
      formData.append('docket_no', docketNo.trim());
      formData.append('courier_datetime', courierDatetime);

      // Append each LR file
      for (const lrNumber of task.lorry_receipts) {
        const uri = lrFiles[lrNumber];
        if (uri) {
          const fileName = `${lrNumber}_file`;
          formData.append(fileName, {
            uri,
            name: `${fileName}.jpg`,
            type: 'image/jpeg',
          } as any);
        }
      }

      await editLastMileOpod(formData);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `HPOD for ${task.enquiry_no} updated successfully.`);
      onSuccess();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={formStyles.root}>
        {/* Header */}
        <View style={formStyles.header}>
          <View style={formStyles.headerLeft}>
            <MaterialCommunityIcons name="clipboard-check" size={22} color={Colors.success} />
            <Text style={formStyles.headerTitle}>Update HPOD</Text>
          </View>
          <Pressable onPress={onClose} style={formStyles.closeBtn}>
            <Feather name="x" size={22} color={Colors.text} />
          </Pressable>
        </View>

        <ScrollView style={formStyles.scrollBody} contentContainerStyle={formStyles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Info Banner */}
          <View style={formStyles.infoBanner}>
            <Text style={formStyles.infoEnquiry}>{task.enquiry_no}</Text>
            <Text style={formStyles.infoCustomer}>{task.customer_name}</Text>
            <Text style={formStyles.infoRoute}>{task.from_location} → {task.to_location}</Text>
          </View>

          {/* Courier Partner + Docket No */}
          <View style={formStyles.rowTwoCol}>
            <View style={[formStyles.field, { flex: 1 }]}>
              <Text style={formStyles.label}>COURIER PARTNER</Text>
              <View style={formStyles.inputBox}>
                <MaterialCommunityIcons name="truck-delivery" size={16} color={Colors.textLight} />
                <TextInput
                  style={formStyles.textInput}
                  placeholder="e.g. BlueDart"
                  placeholderTextColor={Colors.textLight}
                  value={courierName}
                  onChangeText={setCourierName}
                />
              </View>
            </View>
            <View style={[formStyles.field, { flex: 1 }]}>
              <Text style={formStyles.label}>DOCKET NO</Text>
              <View style={formStyles.inputBox}>
                <Feather name="hash" size={15} color={Colors.textLight} />
                <TextInput
                  style={formStyles.textInput}
                  placeholder="Enter Docket #"
                  placeholderTextColor={Colors.textLight}
                  value={docketNo}
                  onChangeText={setDocketNo}
                />
              </View>
            </View>
          </View>

          {/* Dispatch Date & Time */}
          <View style={formStyles.field}>
            <Text style={formStyles.label}>DISPATCH DATE & TIME</Text>
            <View style={formStyles.dateTimeRow}>
              <Pressable style={[formStyles.inputBox, { flex: 1 }]} onPress={() => setShowCal(true)}>
                <Feather name="calendar" size={15} color={Colors.textLight} />
                <Text style={[formStyles.pickerText, dispatchDate && { color: Colors.text }]}>
                  {dispatchDate ? formatDateLabel(dispatchDate) : 'Select date'}
                </Text>
              </Pressable>
              <Pressable style={[formStyles.inputBox, { flex: 1 }]} onPress={() => setShowTime(true)}>
                <Feather name="clock" size={15} color={Colors.textLight} />
                <Text style={[formStyles.pickerText, timeSet && { color: Colors.text }]}>
                  {timeSet ? formatTimeLabel() : 'Select time'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* HPOD Documents (Per LR) */}
          {task.lorry_receipts &&( <View style={formStyles.field}>
            <View style={formStyles.sectionHeader}>
              <Feather name="upload" size={16} color={Colors.primary} />
              <Text style={formStyles.sectionTitle}>HPOD DOCUMENTS (PER LR)</Text>
            </View>
           <View style={formStyles.lrList}>
              {task.lorry_receipts.map((lr) => (
                <View key={lr} style={formStyles.lrItem}>
                  <View style={formStyles.lrHeader}>
                    <View style={formStyles.lrBadge}>
                      <Text style={formStyles.lrBadgeText}>{lr}</Text>
                    </View>
                    {lrFiles[lr] && (
                      <View style={formStyles.lrStatus}>
                        <Feather name="check-circle" size={14} color={Colors.success} />
                        <Text style={[formStyles.lrStatusText, { color: Colors.success }]}>Captured</Text>
                      </View>
                    )}
                  </View>

                  {lrFiles[lr] ? (
                    <View style={formStyles.lrImageBox}>
                      <Image source={{ uri: lrFiles[lr] }} style={formStyles.lrImage} />
                      <Pressable style={formStyles.lrRemoveBtn} onPress={() => removeLrPhoto(lr)}>
                        <Feather name="trash-2" size={14} color={Colors.white} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable style={formStyles.lrCaptureBtn} onPress={() => captureLrPhoto(lr)}>
                      <Feather name="camera" size={20} color={Colors.primary} />
                      <Text style={formStyles.lrCaptureText}>Capture Document</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          </View>
          )}
        </ScrollView>

        {/* Footer Buttons */}
        <View style={formStyles.footer}>
          <Pressable
            style={({ pressed }) => [formStyles.cancelBtn, pressed && { opacity: 0.7 }]}
            onPress={onClose}
            disabled={isSubmitting}
          >
            <Text style={formStyles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              formStyles.submitBtn,
              pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
              isSubmitting && { opacity: 0.6 },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={formStyles.submitText}>Save Details</Text>
            )}
          </Pressable>
        </View>
      </View>

      <CalendarModal
        visible={showCal}
        selectedDate={dispatchDate}
        onSelect={setDispatchDate}
        onClose={() => setShowCal(false)}
      />
      <TimePickerModal
        visible={showTime}
        selectedHour={dispatchHour}
        selectedMinute={dispatchMinute}
        onSelect={(h, m) => { setDispatchHour(h); setDispatchMinute(m); setTimeSet(true); }}
        onClose={() => setShowTime(false)}
      />
    </Modal>
  );
}

const formStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingTop: 24, backgroundColor: Colors.card,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text },
  closeBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  scrollBody: { flex: 1 },
  scrollContent: { padding: 16, gap: 20, paddingBottom: 40 },

  infoBanner: {
    backgroundColor: '#E8F5E9', borderRadius: 14, padding: 16,
    borderLeftWidth: 4, borderLeftColor: Colors.success,
  },
  infoEnquiry: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.primary, marginBottom: 4 },
  infoCustomer: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.text },
  infoRoute: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 4 },

  rowTwoCol: { flexDirection: 'row', gap: 12 },
  field: { gap: 6 },
  label: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, letterSpacing: 0.5 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.card, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 12, height: 48,
  },
  textInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text },
  pickerText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.textLight },

  dateTimeRow: { flexDirection: 'row', gap: 10 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, letterSpacing: 0.5 },

  lrList: { gap: 12 },
  lrItem: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, gap: 10,
  },
  lrHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lrBadge: { backgroundColor: '#EBF1FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  lrBadgeText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  lrStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lrStatusText: { fontSize: 11, fontFamily: 'Inter_500Medium' },

  lrCaptureBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
  },
  lrCaptureText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.primary },

  lrImageBox: { width: '100%', height: 140, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  lrImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  lrRemoveBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,59,48,0.85)', alignItems: 'center', justifyContent: 'center',
  },

  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, paddingBottom: 32,
    backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  cancelBtn: {
    flex: 1, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
  },
  cancelText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  submitBtn: {
    flex: 1.5, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.success,
  },
  submitText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.white },
});

// ─── HPOD Card ───────────────────────────────────────────────────────────────

function HPODCard({ task, onAction }: { task: LastMileOpodData; onAction: (t: LastMileOpodData) => void }) {
  const createdDate = new Date(task.created_on);
  const dateStr = `${String(createdDate.getDate()).padStart(2, '0')}-${String(createdDate.getMonth() + 1).padStart(2, '0')}-${createdDate.getFullYear()}`;
  const timeStr = `${String(createdDate.getHours()).padStart(2, '0')}:${String(createdDate.getMinutes()).padStart(2, '0')}`;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <Text style={styles.cardEnquiry}>{task.enquiry_no}</Text>
          <Text style={styles.cardDate}>{dateStr} {timeStr}</Text>
        </View>
        <View style={[styles.statusBadge]}>
          <Text style={styles.statusText}>{task.status}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.customerRow}>
          <Feather name="briefcase" size={13} color={Colors.textSecondary} />
          <Text style={styles.customerName} numberOfLines={2}>{task.customer_name}</Text>
        </View>

        <View style={styles.routeRow}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.routeText} numberOfLines={1}>{task.from_location}</Text>
          </View>
          <MaterialCommunityIcons name="arrow-right" size={16} color={Colors.textLight} />
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: Colors.error }]} />
            <Text style={styles.routeText} numberOfLines={1}>{task.to_location}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerInfo}>
          <View style={styles.footerItem}>
            <MaterialCommunityIcons name="truck" size={13} color={Colors.textLight} />
            <Text style={styles.footerText}>{task.vehicle_no}</Text>
          </View>
          <View style={styles.footerSep} />
          {task.lorry_receipts && (<View style={styles.footerItem}>
            <Feather name="file" size={13} color={Colors.textLight} />
            <Text style={styles.footerText}>{task.lorry_receipts.length} LR(s)</Text>
          </View>)}
        </View>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
          onPress={() => onAction(task)}
        >
          <Feather name="edit-2" size={16} color={Colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function HPODScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [tasks, setTasks] = useState<LastMileOpodData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editTask, setEditTask] = useState<LastMileOpodData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await getLastMileOpodDisplay();
      setTasks(response.last_mile_opod_data);
      setTotalCount(response.total_count);
    } catch (error) {
      Alert.alert('Error', 'Failed to load HPOD tasks.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const openEdit = (task: LastMileOpodData) => {
    setEditTask(task);
    setShowEditModal(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.white} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>HPOD</Text>
          <Text style={styles.headerSubtitle}>Hard Proof of Delivery</Text>
        </View>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons name="clipboard-check" size={20} color="#7C3AED" />
        </View>
      </View>

      

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 80 }} />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.enquiry_no}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 24 }]}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={56} color={Colors.border} />
              <Text style={styles.emptyTitle}>All Clear!</Text>
              <Text style={styles.emptyText}>No pending HPOD tasks at the moment.</Text>
            </View>
          }
          renderItem={({ item }) => <HPODCard task={item} onAction={openEdit} />}
        />
      )}

      <HpodEditModal
        visible={showEditModal}
        task={editTask}
        onClose={() => setShowEditModal(false)}
        onSuccess={fetchTasks}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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
  headerIcon: {
    marginLeft: 'auto', width: 42, height: 42, borderRadius: 12,
    backgroundColor: "#F3F0FF", alignItems: 'center', justifyContent: 'center',
  },
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    justifyContent: 'center',
  },
  summaryItem: { alignItems: 'center', gap: 2 },
  summaryNum: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.text },
  summaryLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  listContent: { padding: 16, gap: 12 },
  listHeader: {
    fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.text,
    marginBottom: 4,
  },
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTopLeft: { gap: 2 },
  cardEnquiry: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.primary },
  cardDate: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textLight },
  statusBadge: {
    backgroundColor: '#F3F0FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  statusText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#7C3AED' },
  cardBody: { gap: 10, marginBottom: 14 },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  customerName: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.text, flex: 1 },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, flex: 1 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textLight },
  footerSep: { width: 1, height: 12, backgroundColor: Colors.border },
  actionBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    padding: 60, gap: 12,
  },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, textAlign: 'center' },
});
