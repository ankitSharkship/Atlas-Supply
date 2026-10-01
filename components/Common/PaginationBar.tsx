import Colors from '@/constants/colors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PaginationBarProps {
  page: number; // 0-indexed
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  bottomInset?: number;
  fadeColor?: string; // hex color, defaults to screen background
}

const BAR_HEIGHT = 52;
const MARGIN = 14;
const FADE_HEIGHT = 130;

export const PaginationBar: React.FC<PaginationBarProps> = ({
  page,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  bottomInset,
  fadeColor = Colors.background,
}) => {
  const insets = useSafeAreaInsets();
  const bottom = bottomInset ?? insets.bottom;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <LinearGradient
        colors={[`${fadeColor}00`, fadeColor]}
        style={[styles.fade, { height: FADE_HEIGHT + BAR_HEIGHT + bottom }]}
        pointerEvents="none"
      />
      <View style={[styles.barWrapper, { bottom: bottom + MARGIN }]} pointerEvents="box-none">
        <BlurView intensity={45} tint="light" style={styles.bar}>
          <TouchableOpacity
            style={[styles.navBtn, hasPrev ? styles.navBtnActive : styles.navBtnDisabled]}
            onPress={onPrev}
            disabled={!hasPrev}
            hitSlop={8}
          >
            <Feather
              name="chevron-left"
              size={20}
              color={hasPrev ? Colors.white : Colors.textLight}
            />
          </TouchableOpacity>

          <Text style={styles.pageLabel}>Page {page + 1}</Text>

          <TouchableOpacity
            style={[styles.navBtn, hasNext ? styles.navBtnActive : styles.navBtnDisabled]}
            onPress={onNext}
            disabled={!hasNext}
            hitSlop={8}
          >
            <Feather
              name="chevron-right"
              size={20}
              color={hasNext ? Colors.white : Colors.textLight}
            />
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  barWrapper: {
    position: 'absolute',
    left: MARGIN,
    right: MARGIN,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    paddingHorizontal: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnActive: {
    backgroundColor: Colors.accent,
  },
  navBtnDisabled: {
    backgroundColor: 'rgba(148,163,184,0.25)',
  },
  pageLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
});
