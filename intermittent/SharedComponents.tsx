import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';

// ─── Design Tokens ─────────────────────────────────────────────────────────────
export const colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  headerBg: '#2563EB',
  white: '#FFFFFF',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  borderFocus: '#2563EB',
  borderError: '#EF4444',
  text: '#0F172A',
  textMuted: '#64748B',
  textPlaceholder: '#94A3B8',
  error: '#EF4444',
  errorBg: '#FEF2F2',
  success: '#10B981',
  warningBg: '#FFFBEB',
  warningBorder: '#F59E0B',
  sectionBg: '#F0FDF4',
  sectionBorder: '#BBF7D0',
  employeeBg: '#EFF6FF',
  employeeBorder: '#BFDBFE',
  divider: '#E2E8F0',
};

// ─── FormField ─────────────────────────────────────────────────────────────────
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  style?: object;
}
export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  children,
  style,
}) => (
  <View style={[styles.fieldWrapper, style]}>
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      {required && <Text style={styles.required}> *</Text>}
    </View>
    {children}
    {!!error && (
      <View style={styles.errorRow}>
        <Text style={styles.errorIcon}>⊘ </Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )}
  </View>
);

// ─── StyledTextInput ────────────────────────────────────────────────────────────
interface StyledInputProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: boolean;
  editable?: boolean;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: object;
}
export const StyledInput: React.FC<StyledInputProps> = ({
  value,
  onChangeText,
  placeholder,
  error,
  editable = true,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  style,
}) => (
  <TextInput
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor={colors.textPlaceholder}
    editable={editable}
    keyboardType={keyboardType}
    autoCapitalize={autoCapitalize}
    style={[
      styles.input,
      error && styles.inputError,
      !editable && styles.inputDisabled,
      style,
    ]}
  />
);

// ─── SelectDropdown (simple modal-free picker using TouchableOpacity list) ──────
interface SelectOption<T extends string> {
  label: string;
  value: T;
}
interface SelectDropdownProps<T extends string> {
  options: SelectOption<T>[];
  value: T | '';
  onChange: (v: T) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
}
export function SelectDropdown<T extends string>({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  error,
  disabled,
}: SelectDropdownProps<T>) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.selectTrigger,
          error && styles.inputError,
          open && styles.selectTriggerOpen,
          disabled && styles.inputDisabled,
        ]}
        onPress={() => !disabled && setOpen(v => !v)}
        activeOpacity={0.8}
      >
        <Text
          style={[styles.selectText, !selected && styles.selectPlaceholder]}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdown}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.dropdownItem,
                opt.value === value && styles.dropdownItemSelected,
              ]}
              onPress={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.value === value && (
                <Text style={styles.checkmark}>✓  </Text>
              )}
              <Text
                style={[
                  styles.dropdownItemText,
                  opt.value === value && styles.dropdownItemTextSelected,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── ToggleTabs ────────────────────────────────────────────────────────────────
interface ToggleTabsProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}
export const ToggleTabs: React.FC<ToggleTabsProps> = ({
  options,
  value,
  onChange,
}) => (
  <View style={styles.toggleWrapper}>
    {options.map(opt => (
      <TouchableOpacity
        key={opt.value}
        style={[
          styles.toggleTab,
          opt.value === value && styles.toggleTabActive,
        ]}
        onPress={() => onChange(opt.value)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.toggleTabText,
            opt.value === value && styles.toggleTabTextActive,
          ]}
        >
          {opt.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ─── SectionCard ───────────────────────────────────────────────────────────────
interface SectionCardProps {
  children: React.ReactNode;
  variant?: 'green' | 'blue' | 'yellow';
  style?: object;
}
export const SectionCard: React.FC<SectionCardProps> = ({
  children,
  variant = 'green',
  style,
}) => {
  const variantStyle = {
    green: { backgroundColor: colors.sectionBg, borderColor: colors.sectionBorder },
    blue: { backgroundColor: colors.employeeBg, borderColor: colors.employeeBorder },
    yellow: { backgroundColor: colors.warningBg, borderColor: colors.warningBorder },
  }[variant];

  return (
    <View style={[styles.sectionCard, variantStyle, style]}>{children}</View>
  );
};

// ─── FileUploadButton ──────────────────────────────────────────────────────────
interface FileUploadButtonProps {
  label: string;
  file: File | null;
  onPress: () => void;
  error?: boolean;
  hint?: string;
}
export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  label,
  file,
  onPress,
  error,
  hint,
}) => (
  <TouchableOpacity
    style={[styles.uploadArea, error && styles.uploadAreaError]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={styles.uploadIcon}>↑</Text>
    {file ? (
      <Text style={[styles.uploadText, { color: colors.primary }]}>
        {(file as any).name || 'File selected'}
      </Text>
    ) : (
      <>
        <Text style={styles.uploadText}>Click to upload or drag and drop</Text>
        <Text style={styles.uploadHint}>
          {hint || 'JPEG, PNG, GIF, PDF up to 10 MB · Maximum 1 file'}
        </Text>
      </>
    )}
  </TouchableOpacity>
);

// ─── NavButtons ────────────────────────────────────────────────────────────────
interface NavButtonsProps {
  onCancel: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  nextLabel?: string;
  showPrev?: boolean;
}
export const NavButtons: React.FC<NavButtonsProps> = ({
  onCancel,
  onPrev,
  onNext,
  onSubmit,
  isSubmitting,
  nextLabel = 'Continue',
  showPrev = true,
}) => (
  <View style={styles.navRow}>
    <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
      <Text style={styles.cancelBtnText}>Cancel</Text>
    </TouchableOpacity>
    {showPrev && onPrev && (
      <TouchableOpacity style={styles.prevBtn} onPress={onPrev}>
        <Text style={styles.prevBtnText}>‹  Previous</Text>
      </TouchableOpacity>
    )}
    {onNext && (
      <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
        <Text style={styles.nextBtnText}>{nextLabel}  ›</Text>
      </TouchableOpacity>
    )}
    {onSubmit && (
      <TouchableOpacity
        style={[styles.nextBtn, isSubmitting && styles.nextBtnDisabled]}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <Text style={styles.nextBtnText}>Submit Request  ✓</Text>
        )}
      </TouchableOpacity>
    )}
  </View>
);

// ─── StepIndicator ─────────────────────────────────────────────────────────────
interface StepIndicatorProps {
  current: number;
  total: number;
  labels: string[];
}
export const StepIndicator: React.FC<StepIndicatorProps> = ({
  current,
  total,
  labels,
}) => (
  <View style={styles.stepRow}>
    {Array.from({ length: total }).map((_, i) => {
      const step = i + 1;
      const done = step < current;
      const active = step === current;
      return (
        <React.Fragment key={step}>
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                done && styles.stepCircleDone,
                active && styles.stepCircleActive,
              ]}
            >
              <Text
                style={[
                  styles.stepNum,
                  (done || active) && styles.stepNumActive,
                ]}
              >
                {done ? '✓' : step}
              </Text>
            </View>
            <Text
              style={[styles.stepLabel, active && styles.stepLabelActive]}
              numberOfLines={1}
            >
              {labels[i]}
            </Text>
          </View>
          {i < total - 1 && (
            <View style={[styles.stepLine, done && styles.stepLineDone]} />
          )}
        </React.Fragment>
      );
    })}
  </View>
);

// ─── PhoneInput ────────────────────────────────────────────────────────────────
interface PhoneInputProps {
  value: string;
  onChangeText: (v: string) => void;
  error?: boolean;
}
export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  error,
}) => (
  <View
    style={[styles.phoneWrapper, error && styles.inputError]}
  >
    <View style={styles.phoneFlag}>
      <Text style={styles.phoneFlagText}>🇮🇳</Text>
    </View>
    <Text style={styles.phonePrefix}>+91</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder="Enter number"
      placeholderTextColor={colors.textPlaceholder}
      keyboardType="phone-pad"
      style={styles.phoneInput}
    />
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Field
  fieldWrapper: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', marginBottom: 6 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  required: { fontSize: 14, fontWeight: '600', color: colors.error },
  errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  errorIcon: { fontSize: 12, color: colors.error },
  errorText: { fontSize: 12, color: colors.error, flex: 1 },

  // Input
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 11,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputError: { borderColor: colors.borderError, borderWidth: 1.5 },
  inputDisabled: { backgroundColor: '#F1F5F9', color: colors.textMuted },

  // Select
  selectTrigger: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
  },
  selectTriggerOpen: { borderColor: colors.primary, borderWidth: 1.5 },
  selectText: { fontSize: 14, color: colors.text, flex: 1 },
  selectPlaceholder: { color: colors.textPlaceholder },
  chevron: { fontSize: 11, color: colors.textMuted, marginLeft: 8 },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
    zIndex: 999,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  dropdownItemSelected: { backgroundColor: '#F1F5F9' },
  checkmark: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  dropdownItemText: { fontSize: 14, color: colors.text },
  dropdownItemTextSelected: { fontWeight: '600', color: colors.primary },

  // Toggle
  toggleWrapper: {
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  toggleTabActive: { backgroundColor: colors.primary },
  toggleTabText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  toggleTabTextActive: { color: colors.white },

  // Section Card
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },

  // Upload
  uploadArea: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  uploadAreaError: { borderColor: colors.borderError },
  uploadIcon: { fontSize: 22, color: colors.textMuted, marginBottom: 6 },
  uploadText: { fontSize: 13, color: colors.text, fontWeight: '500' },
  uploadHint: { fontSize: 11, color: colors.textMuted, marginTop: 3 },

  // Nav
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: 8,
    gap: 8,
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
  prevBtn: {
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  prevBtnText: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  nextBtn: {
    marginLeft: 'auto' as any,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextBtnDisabled: { opacity: 0.6 },
  nextBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },

  // Step indicator
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  stepItem: { alignItems: 'center', width: 56 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  stepCircleDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepCircleActive: { borderColor: colors.primary },
  stepNum: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  stepNumActive: { color: colors.primary },
  stepLabel: { fontSize: 9, color: colors.textMuted, marginTop: 3, textAlign: 'center' },
  stepLabelActive: { color: colors.primary, fontWeight: '600' },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginBottom: 12 },
  stepLineDone: { backgroundColor: colors.primary },

  // Phone
  phoneWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  phoneFlag: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  phoneFlagText: { fontSize: 18 },
  phonePrefix: {
    paddingHorizontal: 8,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 13 : 11,
    fontSize: 14,
    color: colors.text,
  },
});
