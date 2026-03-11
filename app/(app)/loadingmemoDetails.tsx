import Colors from '@/constants/colors';
import {
  getLoadingMemoDisplay,
  LoadingMemoData,
  uploadLoadingMemo,
  UploadLoadingMemoResponse,
} from '@/lib/api-service';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Upload Modal ─────────────────────────────────────────────────────────────

interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
}

function UploadMemoModal({
  visible,
  task,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  task: LoadingMemoData | null;
  onClose: () => void;
  onSuccess: (updated: UploadLoadingMemoResponse['updated_data']) => void;
}) {
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state whenever the modal opens for a different task
  useEffect(() => {
    if (visible) {
      setPickedFile(null);
      setIsSubmitting(false);
    }
  }, [visible, task?.enquiry_no]);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const sizeBytes = asset.size ?? 0;
      const MAX_BYTES = 5 * 1024 * 1024;

      if (sizeBytes > MAX_BYTES) {
        Alert.alert('File too large', 'Please select a file under 5 MB.');
        return;
      }

      setPickedFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
      });

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      Alert.alert('Error', 'Unable to pick file. Please try again.');
    }
  };

  const handleUpload = async () => {
    if (!task) return;
    if (!pickedFile) {
      Alert.alert('No file selected', 'Please choose a PDF or image file first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result: UploadLoadingMemoResponse = await uploadLoadingMemo(
        task.enquiry_no,
        pickedFile.uri,
        pickedFile.name,
        pickedFile.mimeType,
      );

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const { updated_data } = result;

      Alert.alert(
        'Upload Successful ✓',
        [
          `Enquiry: ${updated_data.enquiry_no}`,
          `Vehicle: ${updated_data.vehicle_no}`,
          `Verification: ${updated_data.loading_memo_verification_status}`,
          `Updated by: ${updated_data.updated_by}`,
        ].join('\n'),
        [{ text: 'OK' }],
      );

      // Patch the item in-place in the parent list so the card reflects
      // the new memo URL and verification status immediately
      onSuccess(updated_data);
      onClose();
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  const fileIcon = pickedFile
    ? pickedFile.mimeType === 'application/pdf'
      ? 'file-pdf-box'
      : 'file-image'
    : 'file-upload-outline';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={!isSubmitting ? onClose : undefined}
    >
      <View style={uploadStyles.overlay}>
        <View style={uploadStyles.sheet}>
          {/* Header */}
          <View style={uploadStyles.header}>
            <View style={uploadStyles.headerLeft}>
              <MaterialCommunityIcons name="file-upload" size={24} color={Colors.primary} />
              <Text style={uploadStyles.headerTitle}>Upload Loading Memo</Text>
            </View>
            {!isSubmitting && (
              <Pressable onPress={onClose} style={uploadStyles.closeBtn} hitSlop={8}>
                <Feather name="x" size={20} color={Colors.text} />
              </Pressable>
            )}
          </View>

          {/* Info Card */}
          <View style={uploadStyles.infoCard}>
            <View style={uploadStyles.infoRow}>
              <Text style={uploadStyles.infoLabel}>Enquiry No:</Text>
              <Text style={uploadStyles.infoValue}>{task.enquiry_no}</Text>
            </View>
            <View style={uploadStyles.infoDivider} />
            <View style={uploadStyles.infoRow}>
              <Text style={uploadStyles.infoLabel}>Vehicle No:</Text>
              <Text style={uploadStyles.infoValue}>{task.vehicle_no}</Text>
            </View>
          </View>

          {/* File Picker */}
          <Text style={uploadStyles.fieldLabel}>
            Select Loading Memo File <Text style={uploadStyles.required}>*</Text>
          </Text>
          <Pressable
            style={({ pressed }) => [
              uploadStyles.filePicker,
              pickedFile && uploadStyles.filePickerSelected,
              pressed && { opacity: 0.75 },
            ]}
            onPress={pickFile}
            disabled={isSubmitting}
          >
            <MaterialCommunityIcons
              name={fileIcon as any}
              size={20}
              color={pickedFile ? Colors.primary : Colors.textLight}
            />
            <Text
              style={[
                uploadStyles.filePickerText,
                pickedFile && uploadStyles.filePickerTextSelected,
              ]}
              numberOfLines={1}
            >
              {pickedFile ? pickedFile.name : 'Choose PDF or Image'}
            </Text>
            {pickedFile && (
              <Pressable
                onPress={() => setPickedFile(null)}
                hitSlop={8}
                style={uploadStyles.fileClearBtn}
              >
                <Feather name="x-circle" size={16} color={Colors.textLight} />
              </Pressable>
            )}
          </Pressable>
          <Text style={uploadStyles.fileHint}>Maximum file size: 5MB</Text>
          <Text style={uploadStyles.fileHint}>Allowed file types: PDF, JPG, JPEG, PNG</Text>

          {/* Footer */}
          <View style={uploadStyles.footer}>
            <Pressable
              style={({ pressed }) => [
                uploadStyles.cancelBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={uploadStyles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                uploadStyles.uploadBtn,
                !pickedFile && uploadStyles.uploadBtnDisabled,
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleUpload}
              disabled={isSubmitting || !pickedFile}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="file-upload-outline" size={18} color={Colors.white} />
                  <Text style={uploadStyles.uploadText}>Upload Memo</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const uploadStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginBottom: 10,
  },
  required: { color: Colors.error, fontFamily: 'Inter_700Bold' },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 8,
  },
  filePickerSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EBF1FF',
  },
  filePickerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textLight,
  },
  filePickerTextSelected: {
    color: Colors.primary,
    fontFamily: 'Inter_500Medium',
  },
  fileClearBtn: { padding: 2 },
  fileHint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cancelText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  uploadBtn: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
  },
  uploadBtnDisabled: {
    backgroundColor: '#A8B8D8',
  },
  uploadText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
  },
});

// ─── Memo Card ────────────────────────────────────────────────────────────────

function MemoCard({
  item,
  onUpload,
}: {
  item: LoadingMemoData;
  onUpload: (item: LoadingMemoData) => void;
}) {
  const createdDate = new Date(item.created_on);
  const dateStr = `${String(createdDate.getDate()).padStart(2, '0')}-${String(
    createdDate.getMonth() + 1,
  ).padStart(2, '0')}-${createdDate.getFullYear()}`;
  const timeStr = `${String(createdDate.getHours()).padStart(2, '0')}:${String(
    createdDate.getMinutes(),
  ).padStart(2, '0')}`;

  const uploaded = !!item.loading_memo;

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.cardTop}>
        <View style={cardStyles.cardTopLeft}>
          <Text style={cardStyles.enquiryNo}>{item.enquiry_no}</Text>
          <Text style={cardStyles.dateText}>
            {dateStr} {timeStr}
          </Text>
        </View>
        <View style={cardStyles.statusBadge}>
          <Text style={cardStyles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={cardStyles.cardBody}>
        <View style={cardStyles.rowInfo}>
          <Feather name="briefcase" size={13} color={Colors.textSecondary} />
          <Text style={cardStyles.customerName} numberOfLines={2}>
            {item.customer_name}
          </Text>
        </View>

        <View style={cardStyles.routeRow}>
          <View style={cardStyles.routePoint}>
            <View style={[cardStyles.dot, { backgroundColor: Colors.success }]} />
            <Text style={cardStyles.routeText} numberOfLines={1}>
              {item.from_location}
            </Text>
          </View>
          <MaterialCommunityIcons name="arrow-right" size={16} color={Colors.textLight} />
          <View style={cardStyles.routePoint}>
            <View style={[cardStyles.dot, { backgroundColor: Colors.error }]} />
            <Text style={cardStyles.routeText} numberOfLines={1}>
              {item.to_location}
            </Text>
          </View>
        </View>
      </View>

      <View style={cardStyles.cardFooter}>
        <View style={cardStyles.footerLeft}>
          <View style={cardStyles.footerItem}>
            <MaterialCommunityIcons name="truck" size={13} color={Colors.textLight} />
            <Text style={cardStyles.footerText}>{item.vehicle_no}</Text>
          </View>
          <View style={cardStyles.footerSep} />
          <View style={cardStyles.footerItem}>
            {uploaded ? (
              <Feather name="check-circle" size={13} color={Colors.success} />
            ) : (
              <Feather name="clock" size={13} color={Colors.textLight} />
            )}
            <Text style={[cardStyles.footerText, uploaded && { color: Colors.success }]}>
              {uploaded ? 'Uploaded' : 'Pending'}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            cardStyles.uploadBtn,
            uploaded && cardStyles.uploadBtnDone,
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => onUpload(item)}
        >
          <Feather
            name={uploaded ? 'refresh-cw' : 'upload'}
            size={15}
            color={Colors.white}
          />
          <Text style={cardStyles.uploadBtnText}>{uploaded ? 'Re-upload' : 'Upload'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
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
  enquiryNo: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.primary },
  dateText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textLight },
  statusBadge: {
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#7C3AED' },
  cardBody: { gap: 10, marginBottom: 14 },
  rowInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  customerName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.text,
    flex: 1,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  routePoint: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  routeText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textLight },
  footerSep: { width: 1, height: 12, backgroundColor: Colors.border },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  uploadBtnDone: {
    backgroundColor: Colors.success,
  },
  uploadBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LoadingMemoScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [items, setItems] = useState<LoadingMemoData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [uploadTask, setUploadTask] = useState<LoadingMemoData | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await getLoadingMemoDisplay();
      setItems(response.loading_memo_data);
      setTotalCount(response.total_count);
    } catch {
      Alert.alert('Error', 'Failed to load loading memo data.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleUploadSuccess = useCallback(
    (updated: UploadLoadingMemoResponse['updated_data']) => {
      // Patch the matching item in-place so the card refreshes instantly
      setItems((prev) =>
        prev.map((item) =>
          item.enquiry_no === updated.enquiry_no
            ? {
                ...item,
                loading_memo: updated.loading_memo,
                loading_memo_verification_status:
                  updated.loading_memo_verification_status === 'PENDING' ? false : true,
                status: updated.status,
                updated_at: updated.updated_at,
                updated_by: updated.updated_by,
              }
            : item,
        ),
      );
    },
    [],
  );

  const openUpload = (item: LoadingMemoData) => {
    setUploadTask(item);
    setShowUpload(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.white} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Loading Memo</Text>
          <Text style={styles.headerSubtitle}>Upload & manage loading memos</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{totalCount}</Text>
        </View>
      </View>

    
      {isLoading ? (
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
            { paddingBottom: bottomPad + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="clipboard-check-outline"
                size={56}
                color={Colors.border}
              />
              <Text style={styles.emptyTitle}>All Clear!</Text>
              <Text style={styles.emptyText}>
                No pending loading memos at the moment.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <MemoCard item={item} onUpload={openUpload} />
          )}
        />
      )}

      <UploadMemoModal
        visible={showUpload}
        task={uploadTask}
        onClose={() => setShowUpload(false)}
        onSuccess={handleUploadSuccess}
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
  countBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  countText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.white,
  },
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    justifyContent: 'center',
    gap: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryNum: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  listContent: { padding: 16 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
