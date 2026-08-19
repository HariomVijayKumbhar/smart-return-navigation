import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StatusBar,
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tripService } from '../services/tripService';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDistance, formatDuration } from '../utils/geo';

export default function TripHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTrips = async () => {
    try {
      const data = await tripService.getUserTrips(user?.uid || 'guest_user');
      setTrips(data);
    } catch (err) {
      console.error('Error fetching trip history:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [user]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTrips();
  };

  const renderTripItem = ({ item }) => {
    const tripId = item.tripId || item.id;
    const destName = item.destination?.name || 'Destination Trip';
    const startName = item.startLocation?.name || 'Start Point';

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('TripDetail', { tripId, trip: item })}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.destTitle} numberOfLines={1}>
              {destName}
            </Text>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>

          {/* Reserved Sensor Mode Indicator per Section 5 */}
          {item.usedSensorMode && (
            <View style={styles.sensorBadge}>
              <Text style={styles.sensorBadgeText}>Sensor Mode</Text>
            </View>
          )}
        </View>

        <View style={styles.routeSummaryRow}>
          <Text style={styles.routeSummaryText}>📍 From: {startName}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{formatDistance(item.distance)}</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{formatDuration(item.duration)}</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>View Path</Text>
            <Text style={styles.viewPathLink}>Details →</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recorded Trip History</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading saved trips...</Text>
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🧭</Text>
          <Text style={styles.emptyTitle}>No Recorded Trips Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a navigation session on the home screen to record your first outbound route.
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.tripId || item.id || String(Math.random())}
          renderItem={renderTripItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#6366f1"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  destTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '700',
  },
  dateText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  sensorBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  sensorBadgeText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: '700',
  },
  routeSummaryRow: {
    marginBottom: 14,
  },
  routeSummaryText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  viewPathLink: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  }
});
