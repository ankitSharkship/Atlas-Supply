import Colors from "@/constants/colors";
import { Feather } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DateTimePickerModal({
  visible,
  selectedDateTime,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedDateTime: Date | null;
  onSelect: (d: Date) => void;
  onClose: () => void;
}) {
  const [viewDate, setViewDate] = useState(
    () => selectedDateTime ?? new Date(),
  );
  const [selected, setSelected] = useState<Date>(
    () => selectedDateTime ?? new Date(),
  );

  // Refs for ScrollView
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  const scrollToSelectedTime = () => {
    const hour = selected.getHours();
    const minute = selected.getMinutes();

    // Scroll hours to selected hour (each item 44px height + 4px margin = 48px)
    hourScrollRef.current?.scrollTo({
      y: hour * 48,
      animated: true,
    });

    // Scroll minutes to selected minute
    minuteScrollRef.current?.scrollTo({
      y: minute * 48,
      animated: true,
    });
  };

  // Reset states and scroll to selected time when modal opens
  useEffect(() => {
    if (visible) {
      const d = selectedDateTime ?? new Date();
      setViewDate(d);
      setSelected(d);

      // Scroll to selected hour/minute after brief delay
      setTimeout(() => {
        scrollToSelectedTime();
      }, 100);
    }
  }, [visible, selectedDateTime]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1,
  );

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const isFuture = (date: Date) => date > new Date();

  const updateDate = (day: number) => {
    const updated = new Date(selected);
    updated.setFullYear(year, month, day);
    setSelected(updated);
  };

  const updateHour = (h: number) => {
    const updated = new Date(selected);
    updated.setHours(h);
    setSelected(updated);
  };

  const updateMinute = (m: number) => {
    const updated = new Date(selected);
    updated.setMinutes(m);
    setSelected(updated);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={mStyles.overlay} onPress={onClose}>
        <Pressable style={mStyles.calCard} onPress={() => {}}>
          {/* HEADER */}
          <View style={mStyles.calHeader}>
            <Pressable
              onPress={() => setViewDate(new Date(year, month - 1, 1))}
              style={mStyles.calNav}
            >
              <Feather name="chevron-left" size={20} />
            </Pressable>

            <Text style={mStyles.calTitle}>
              {MONTHS[month]} {year}
            </Text>

            <Pressable
              onPress={() => setViewDate(new Date(year, month + 1, 1))}
              style={mStyles.calNav}
            >
              <Feather name="chevron-right" size={20} />
            </Pressable>
          </View>

          {/* CALENDAR */}
          <View style={mStyles.calDayRow}>
            {DAYS.map((d) => (
              <Text key={d} style={mStyles.calDayLabel}>
                {d}
              </Text>
            ))}
          </View>

          <View style={mStyles.calGrid}>
            {cells.map((day, i) => {
              const isSelected =
                day &&
                selected.getDate() === day &&
                selected.getMonth() === month &&
                selected.getFullYear() === year;

              return (
                <Pressable
                  key={i}
                  style={[
                    mStyles.calCell,
                    !!isSelected && mStyles.calCellSelected,
                  ]}
                  onPress={() => day && updateDate(day)}
                  disabled={!day}
                >
                  {day && (
                    <Text
                      style={[
                        mStyles.calCellText,
                        !!isSelected && mStyles.calCellTextSel,
                      ]}
                    >
                      {day}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* TIME PICKER */}
          <View style={{ flexDirection: "row", marginTop: 20 }}>
            {/* HOURS */}
            <ScrollView
              ref={hourScrollRef}
              style={{ height: 120, flex: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {hours.map((h) => (
                <Pressable
                  key={h}
                  style={[
                    mStyles.timeItem,
                    selected.getHours() === h && mStyles.timeItemSelected,
                  ]}
                  onPress={() => {
                    updateHour(h);
                    // Scroll to keep selected item visible
                    hourScrollRef.current?.scrollTo({
                      y: h * 48,
                      animated: true,
                    });
                  }}
                >
                  <Text
                    style={[
                      mStyles.timeItemText,
                      selected.getHours() === h && mStyles.timeItemTextSelected,
                    ]}
                  >
                    {String(h).padStart(2, "0")}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* MINUTES */}
            <ScrollView
              ref={minuteScrollRef}
              style={{ height: 120, flex: 1 }}
              showsVerticalScrollIndicator={false}
            >
              {minutes.map((m) => (
                <Pressable
                  key={m}
                  style={[
                    mStyles.timeItem,
                    selected.getMinutes() === m && mStyles.timeItemSelected,
                  ]}
                  onPress={() => {
                    updateMinute(m);
                    // Scroll to keep selected item visible
                    minuteScrollRef.current?.scrollTo({
                      y: m * 48,
                      animated: true,
                    });
                  }}
                >
                  <Text
                    style={[
                      mStyles.timeItemText,
                      selected.getMinutes() === m &&
                        mStyles.timeItemTextSelected,
                    ]}
                  >
                    {String(m).padStart(2, "0")}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* CONFIRM BUTTON - unchanged */}
          <Pressable
            style={[mStyles.timeConfirmBtn, { marginTop: 16 }]}
            onPress={() => {
              if (isFuture(selected)) {
                Alert.alert("Invalid", "Future date/time not allowed");
                return;
              }
              onSelect(selected);
              onClose();
            }}
          >
            <Text style={mStyles.timeConfirmText}>Confirm</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  /* ---------- OVERLAY ---------- */
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  /* ---------- CARD ---------- */
  calCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 360,
  },

  /* ---------- HEADER ---------- */
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  calNav: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  calTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },

  /* ---------- CALENDAR ---------- */
  calDayRow: {
    flexDirection: "row",
    marginBottom: 8,
  },

  calDayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textLight,
  },

  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },

  calCellSelected: {
    backgroundColor: Colors.primary,
  },

  calCellToday: {
    backgroundColor: Colors.background,
  },

  calCellText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },

  calCellTextSel: {
    color: Colors.white,
    fontFamily: "Inter_600SemiBold",
  },

  /* ---------- TIME PICKER ---------- */
  timeCard: {
    // not used directly here but kept for compatibility
  },

  timeTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginBottom: 10,
    textAlign: "center",
  },

  timeColumns: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  timeColumn: {
    alignItems: "center",
  },

  timeColLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    marginBottom: 8,
  },

  timeScroll: {
    height: 120,
    width: 70,
  },

  timeItem: {
    height: 44,
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginBottom: 4,
  },

  timeItemSelected: {
    backgroundColor: Colors.primary,
  },

  timeItemText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },

  timeItemTextSelected: {
    color: Colors.white,
    fontFamily: "Inter_700Bold",
  },

  timeSeparator: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.border,
  },

  /* ---------- CONFIRM BUTTON ---------- */
  timeConfirmBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  timeConfirmText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
  },
});
