import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Calendar, Clock, MapPin, Building, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { getMyDuties } from '../api/schedules';

export default function MyDutiesScreen() {
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDuties = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await getMyDuties();
      if (Array.isArray(data)) {
        setDuties(data);
      } else if (data?.results && Array.isArray(data.results)) {
        setDuties(data.results);
      } else {
        setDuties([]);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Unable to load assigned shifts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDuties();
  }, [fetchDuties]);

  const now = new Date();

  // Current shift detection: shift_start <= now < shift_end
  const currentShift = duties.find((d) => {
    const start = new Date(d.shift_start);
    const end = new Date(d.shift_end);
    return start <= now && now < end;
  });

  // Upcoming shifts: shift_start > now, sorted chronologically
  const upcomingShifts = duties
    .filter((d) => {
      const start = new Date(d.shift_start);
      return start > now;
    })
    .sort((a, b) => new Date(a.shift_start) - new Date(b.shift_start));

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemainingText = (endIso) => {
    const diffMs = new Date(endIso) - new Date();
    if (diffMs <= 0) return 'Shift ending now';
    const totalMin = Math.floor(diffMs / (1000 * 60));
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m remaining`;
    }
    return `${mins}m remaining`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDuties(true)}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Assigned Duties</Text>
          <Text style={styles.subtitle}>View your active and upcoming shift assignments.</Text>
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchDuties(false)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.loadingText}>Loading assigned duties...</Text>
          </View>
        ) : (
          <>
            {/* CURRENT SHIFT HIGHLIGHT */}
            {currentShift && (
              <View style={styles.currentShiftContainer}>
                <View style={styles.currentHeaderRow}>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveBadgeText}>CURRENT SHIFT</Text>
                  </View>
                  <Text style={styles.timeRemainingText}>
                    {getTimeRemainingText(currentShift.shift_end)}
                  </Text>
                </View>

                <Text style={styles.currentSiteName}>{currentShift.location_name}</Text>
                <Text style={styles.currentPostName}>{currentShift.post_name}</Text>

                <View style={styles.currentDetailsRow}>
                  <View style={styles.detailItem}>
                    <Clock size={14} color={colors.textMuted} />
                    <Text style={styles.detailText}>
                      {formatTime(currentShift.shift_start)} - {formatTime(currentShift.shift_end)}
                    </Text>
                  </View>
                  {currentShift.client_name ? (
                    <View style={styles.detailItem}>
                      <Building size={14} color={colors.textMuted} />
                      <Text style={styles.detailText}>{currentShift.client_name}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            )}

            {/* UPCOMING SHIFTS */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Schedule</Text>
              <Text style={styles.sectionCount}>{upcomingShifts.length} shifts</Text>
            </View>

            {upcomingShifts.length > 0 ? (
              <View style={styles.shiftList}>
                {upcomingShifts.map((shift) => (
                  <View key={shift.id} style={styles.shiftCard}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.dateBadge}>
                        <Calendar size={12} color={colors.accent} />
                        <Text style={styles.dateBadgeText}>
                          {formatDate(shift.shift_start)}
                        </Text>
                      </View>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>{shift.status}</Text>
                      </View>
                    </View>

                    <Text style={styles.cardSiteName}>{shift.location_name}</Text>
                    <Text style={styles.cardPostName}>{shift.post_name}</Text>

                    <View style={styles.cardBottomRow}>
                      <View style={styles.detailItem}>
                        <Clock size={13} color={colors.textMuted} />
                        <Text style={styles.detailText}>
                          {formatTime(shift.shift_start)} - {formatTime(shift.shift_end)}
                        </Text>
                      </View>
                      {shift.client_name ? (
                        <View style={styles.detailItem}>
                          <Building size={13} color={colors.textMuted} />
                          <Text style={styles.detailText}>{shift.client_name}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : !currentShift ? (
              <View style={styles.emptyCard}>
                <Calendar size={32} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Assigned Shifts</Text>
                <Text style={styles.emptyDesc}>
                  No shifts scheduled. Contact your supervisor.
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: colors.danger,
  },
  retryButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 4,
  },
  retryText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.danger,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  currentShiftContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    padding: 16,
    marginBottom: 20,
  },
  currentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 0.5,
  },
  timeRemainingText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
  },
  currentSiteName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  currentPostName: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 10,
  },
  currentDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  sectionCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  shiftList: {
    gap: 10,
  },
  shiftCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  cardSiteName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  cardPostName: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  cardBottomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
