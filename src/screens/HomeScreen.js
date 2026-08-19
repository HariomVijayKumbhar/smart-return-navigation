import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import MapViewComponent from '../components/MapViewComponent';
import DestinationModal from '../components/DestinationModal';
import { globalRecordingEngine } from '../engine/RecordingEngine';
import { GPSCollector } from '../engine/collectors/GPSCollector';

export default function HomeScreen({ navigation }) {
  const { user, isGuest, logout } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setHasLocationPermission(true);
          const loc = await Location.getCurrentPositionAsync({});
          setCurrentLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      } catch (e) {
        console.warn('Location permission request failed:', e);
      }
    })();
  }, []);

  const handleStartNavigation = async () => {
    if (!destination) {
      setModalVisible(true);
      return;
    }

    try {
      // Stop any existing active session before starting a new one
      if (globalRecordingEngine.isSessionActive) {
        await globalRecordingEngine.stopSession();
      }

      // Extensibility Rule 1 & 2: Register GPSCollector into RecordingEngine (only once)
      if (!globalRecordingEngine.registeredCollectors.has('gps')) {
        const gpsCollector = new GPSCollector();
        globalRecordingEngine.registerCollector(gpsCollector);
      }

      // Start recording session
      const startLocObj = currentLocation || {
        name: 'Current Location',
        latitude: 28.6139,
        longitude: 77.2090
      };

      await globalRecordingEngine.startSession({
        userId: user?.uid || 'guest_user',
        startLocation: startLocObj,
        destination: destination,
        isGuest: isGuest
      });

      navigation.navigate('Navigation', {
        destination,
        startLocation: startLocObj
      });
    } catch (err) {
      console.error('Failed to start navigation session:', err);
      Alert.alert('Error', 'Could not initialize GPS recording engine.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      
      {/* Top App Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{user?.name || 'Guest Traveler'}</Text>
            <Text style={styles.userRole}>
              {isGuest ? '⚡ Guest Mode' : '👤 Authenticated Account'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Main Map View */}
      <View style={styles.mapContainer}>
        <MapViewComponent
          userLocation={currentLocation}
          destination={destination}
        />

        {/* Destination Card overlay on Map */}
        <TouchableOpacity 
          style={styles.destinationCard}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.destIcon}>
            <Text style={{ fontSize: 18 }}>🏁</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.destLabel}>Destination</Text>
            <Text style={styles.destValue}>
              {destination ? destination.name : 'Tap to select destination...'}
            </Text>
          </View>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.historyBtn}
          onPress={() => navigation.navigate('TripHistory')}
        >
          <Text style={{ fontSize: 20 }}>📜</Text>
          <Text style={styles.historyBtnText}>Trip History</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.startNavBtn, !destination && styles.startNavBtnDisabled]}
          onPress={handleStartNavigation}
        >
          <Text style={{ fontSize: 22 }}>🚀</Text>
          <Text style={styles.startNavBtnText}>
            {destination ? 'Start Navigation' : 'Set Dest First'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Destination Modal */}
      <DestinationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelectDestination={(dest) => {
          setDestination(dest);
          setModalVisible(false);
        }}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  avatarBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
  },
  userName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  userRole: {
    color: '#38bdf8',
    fontSize: 12,
    marginTop: 1,
  },
  logoutBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoutBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  destinationCard: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  destIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  destValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  editBtnText: {
    color: '#6366f1',
    fontWeight: '700',
    fontSize: 13,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 18,
    backgroundColor: '#0f172a',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  historyBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  historyBtnText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  startNavBtn: {
    flex: 1,
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    gap: 8,
    paddingVertical: 14,
  },
  startNavBtnDisabled: {
    backgroundColor: '#475569',
  },
  startNavBtnText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  }
});
