import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalRecordingEngine } from '../engine/RecordingEngine';
import { tripService } from '../services/tripService';
import { useAuth } from '../context/AuthContext';
import MapViewComponent from '../components/MapViewComponent';
import { formatDistance, formatDuration, formatSpeed } from '../utils/geo';

export default function NavigationScreen({ route, navigation }) {
  const { destination, startLocation } = route.params || {};
  const { user, isGuest } = useAuth();
  
  const [sessionState, setSessionState] = useState(globalRecordingEngine.getSessionState());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Subscribe to RecordingEngine live stream updates
    const unsubscribe = globalRecordingEngine.subscribe((newState) => {
      setSessionState(newState);
    });

    return () => unsubscribe();
  }, []);

  const handleEndTrip = async () => {
    Alert.alert(
      'End Navigation',
      'Are you sure you want to stop recording and save this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End & Save', 
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              // Stop recording session via engine
              const summary = await globalRecordingEngine.stopSession();

              // Save to Firestore per Section 5 Schema
              await tripService.saveTrip({
                userId: user?.uid || 'guest_user',
                startLocation: startLocation || { name: 'Origin', latitude: 0, longitude: 0 },
                destination: destination || { name: 'Destination', latitude: 0, longitude: 0 },
                distance: summary.distance,
                duration: summary.duration,
                routePoints: summary.routePoints,
                isGuest: isGuest
              });

              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }, { name: 'TripHistory' }],
              });
            } catch (err) {
              console.error('Error saving trip:', err);
              Alert.alert('Error', 'Failed to save trip data.');
            } finally {
              setIsSaving(false);
            }
          }
        }
      ]
    );
  };

  const currentSpeed = sessionState.latestPoint?.speed || 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      
      {/* Top Banner */}
      <View style={styles.topBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.navHeaderLabel}>Navigating to</Text>
          <Text style={styles.navDestinationTitle} numberOfLines={1}>
            {destination?.name || 'Selected Destination'}
          </Text>
        </View>

        <View style={styles.recordingDotContainer}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>REC</Text>
        </View>
      </View>

      {/* Collector Status Bar */}
      <View style={styles.collectorsBar}>
        <View style={[styles.collectorBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981' }]}>
          <Text style={[styles.collectorBadgeText, { color: '#10b981' }]}>📡 GPS Collector: Active</Text>
        </View>
        <View style={[styles.collectorBadge, { backgroundColor: 'rgba(148, 163, 184, 0.1)', borderColor: '#475569' }]}>
          <Text style={[styles.collectorBadgeText, { color: '#94a3b8' }]}>⚙️ Sensor Slot: Reserved</Text>
        </View>
      </View>

      {/* Live Map Display */}
      <View style={styles.mapContainer}>
        <MapViewComponent
          userLocation={sessionState.latestPoint}
          startLocation={startLocation}
          destination={destination}
          routePoints={sessionState.recordedStream}
          showsUserLocation={true}
        />
      </View>

      {/* Telemetry Dashboard */}
      <View style={styles.telemetryCard}>
        <View style={styles.metricsRow}>
          {/* Speed Metric */}
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Current Speed</Text>
            <Text style={styles.metricValuePrimary}>{formatSpeed(currentSpeed)}</Text>
          </View>

          {/* Distance Metric */}
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Distance</Text>
            <Text style={styles.metricValue}>{formatDistance(sessionState.distance)}</Text>
          </View>

          {/* Time Metric */}
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Duration</Text>
            <Text style={styles.metricValue}>{formatDuration(sessionState.duration)}</Text>
          </View>
        </View>

        <View style={styles.sampleCountRow}>
          <Text style={styles.sampleCountText}>
            📊 Collected Samples: {sessionState.pointsCount} points
          </Text>
        </View>

        {/* Stop Button */}
        <TouchableOpacity 
          style={styles.endBtn} 
          onPress={handleEndTrip}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.endBtnText}>🛑 End Trip & Save Route</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  topBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  navHeaderLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  navDestinationTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  recordingDotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  recordingText: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '800',
  },
  collectorsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0f172a',
    gap: 8,
  },
  collectorBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  collectorBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
  },
  telemetryCard: {
    backgroundColor: '#0f172a',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricValuePrimary: {
    color: '#38bdf8',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  metricValue: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  sampleCountRow: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#1e293b',
    paddingVertical: 6,
    borderRadius: 8,
  },
  sampleCountText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  endBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  endBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  }
});
