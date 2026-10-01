import { PaginationBar } from '@/components/Common/PaginationBar';
import { MemoCard } from '@/components/Memo/memoCard';
import { UploadMemoModal } from '@/components/Memo/uploadMemoModal';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import {
  getLoadingMemoDisplay,
  LoadingMemoData,
  UploadLoadingMemoResponse
} from '@/lib/loadingMemoSerivce';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function LoadingMemoScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
const { user, logout } = useAuth();
  const [items, setItems] = useState<LoadingMemoData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const appliedSearchRef = useRef("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [uploadTask, setUploadTask] = useState<LoadingMemoData | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await getLoadingMemoDisplay(user?.zone, page, PAGE_SIZE, appliedSearch);
      setItems(response.loading_memo_data);
      setTotalCount(response.total_count);
    } catch {
      Alert.alert('Error', 'Failed to load loading memo data.');
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInner}>
          <Feather name="search" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchBarInput}
            placeholder="Search by Enquiry, Order, Customer, Vehicle..."
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
            { paddingBottom: bottomPad + 96 },
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

      <PaginationBar
        page={page}
        hasPrev={hasPrev && !isLoading}
        hasNext={hasNext && !isLoading}
        onPrev={goToPrevPage}
        onNext={goToNextPage}
        bottomInset={bottomPad}
        fadeColor={Colors.background}
      />

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
});
