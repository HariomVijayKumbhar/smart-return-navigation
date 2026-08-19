import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar,
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tripService } from '../services/tripService';
import MapViewComponent from '../components/MapViewComponent';
import { formatDate, formatDistance, formatDuration } from '../utils/geo';

export default function TripDetailScreen({ route, navigation }) {
  const { tripId, trip: initialTrip } = route.params || {};
  const [trip, setTrip] = useState(initialTrip || null);
  const [routePoints, setRoutePoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (tripId) {
        const details = await tripService.getTripDetails(tripId);
        if (details.trip) setTrip(details.trip);
        if (details.routePoints) setRoutePoints(details.routePoints);
      }
      setIsLoading(false);
    })();
  }, [tripId]);

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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {trip?.destination?.name || 'Trip Details'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {trip ? formatDate(trip.createdAt) : ''}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Fetching recorded path...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Replayed Recorded Map Path */}
          <View style={styles.mapContainer}>
            <MapViewComponent
              startLocation={trip?.startLocation}
              destination={trip?.destination}
              routePoints={routePoints}
              interactive={true}
            />
          </View>

          {/* Stats Sheet */}
          <View style={styles.statsSheet}>
            <View style={styles.summaryTitleRow}>
              <Text style={styles.summaryTitle}>Recorded Path Overview</Text>
              <View style={styles.pointBadge}>
                <Text style={styles.pointBadgeText}>{routePoints.length} GPS Points</Text>
              </View>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Distance</Text>
                <Text style={styles.metricValue}>{formatDistance(trip?.distance)}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Duration</Text>
                <Text style={styles.metricValue}>{formatDuration(trip?.duration)}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Sensor Mode</Text>
                <Text style={styles.metricValue}>
                  {trip?.usedSensorMode ? 'Used' : 'Standard'}
                </Text>
              </View>
            </View>

            {/* Location Details */}
            <View style={styles.locContainer}>
              <View style={styles.locRow}>
                <Text style={{ fontSize: 16 }}>🟢</Text>
                <Text style={styles.locText} numberOfLines={1}>
                  Origin: {trip?.startLocation?.name || 'Start Position'}
                </Text>
              </View>
              <View style={styles.locRow}>
                <Text style={{ fontSize: 16 }}>🔴</Text>
                <Text style={styles.locText} numberOfLines={1}>
                  Destination: {trip?.destination?.name || 'End Position'}
                </Text>
              </View>
            </View>
          </View>
        </View>
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
    paddingVertical: 14,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: 14,
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
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#64748b',
    fontSize: 12,
  },
  mapContainer: {
    flex: 1,
  },
  statsSheet: {
    backgroundColor: '#0f172a',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  summaryTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  pointBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  pointBadgeText: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  locContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
  }
});
