import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';

// Dynamically handle MapView for Native vs Web
let MapView, Marker, Polyline, UrlTile, PROVIDER_GOOGLE, PROVIDER_DEFAULT;
if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps.MapView || Maps;
    Marker = Maps.Marker || (Maps.default && Maps.default.Marker);
    Polyline = Maps.Polyline || (Maps.default && Maps.default.Polyline);
    UrlTile = Maps.UrlTile || (Maps.default && Maps.default.UrlTile);
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE || Maps.PROVIDER_DEFAULT;
    PROVIDER_DEFAULT = Maps.PROVIDER_DEFAULT || 'default';
  } catch (e) {
    console.warn('react-native-maps not available, using fallback renderer:', e);
  }
}

export default function MapViewComponent({
  userLocation,
  startLocation,
  destination,
  routePoints = [],
  style,
  showsUserLocation = true,
  interactive = true
}) {
  const mapRef = useRef(null);

  // Center map on user location or first route point or default city
  const defaultRegion = {
    latitude: userLocation?.latitude || routePoints[0]?.latitude || 28.6139,
    longitude: userLocation?.longitude || routePoints[0]?.longitude || 77.2090,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const polylineCoordinates = routePoints.map((pt) => ({
    latitude: pt.latitude,
    longitude: pt.longitude,
  }));

  // Smoothly animate map camera when user position updates on native
  useEffect(() => {
    if (mapRef.current && userLocation?.latitude && userLocation?.longitude) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    }
  }, [userLocation?.latitude, userLocation?.longitude]);

  // Fit route coordinates if a route is active
  useEffect(() => {
    if (mapRef.current && polylineCoordinates.length > 1) {
      mapRef.current.fitToCoordinates(polylineCoordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [polylineCoordinates.length]);

  if (!MapView || Platform.OS === 'web') {
    return (
      <View style={[styles.webFallbackContainer, style]}>
        <View style={styles.webFallbackHeader}>
          <Text style={styles.webFallbackTitle}>🗺️ Interactive Route Map</Text>
          <Text style={styles.webFallbackSubtitle}>
            {routePoints.length > 0 
              ? `Tracking ${routePoints.length} GPS telemetry points`
              : userLocation ? 'Current GPS Location Active' : 'Waiting for GPS fix...'}
          </Text>
        </View>
        
        {/* Visual Simulated Map Display for Web preview */}
        <View style={styles.webMapCanvas}>
          <View style={styles.webGridOverlay} />
          {userLocation && (
            <View style={styles.userDotContainer}>
              <View style={styles.pulseRing} />
              <View style={styles.userDot} />
            </View>
          )}

          {polylineCoordinates.length > 1 && (
            <View style={styles.webPathBadge}>
              <Text style={styles.webPathText}>
                📍 Path Recorded: {polylineCoordinates.length} nodes
              </Text>
            </View>
          )}

          {startLocation && (
            <View style={[styles.pinBadge, { top: 30, left: 30, backgroundColor: '#10b981' }]}>
              <Text style={styles.pinText}>Start: {startLocation.name || 'Origin'}</Text>
            </View>
          )}

          {destination && (
            <View style={[styles.pinBadge, { bottom: 30, right: 30, backgroundColor: '#ef4444' }]}>
              <Text style={styles.pinText}>Dest: {destination.name || 'End Point'}</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <MapView
      ref={mapRef}
      style={[styles.map, style]}
      initialRegion={defaultRegion}
      provider={
        Platform.OS === 'android' && PROVIDER_GOOGLE ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
      }
      showsUserLocation={showsUserLocation}
      followsUserLocation={showsUserLocation}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      showsMyLocationButton={true}
      showsCompass={true}
      mapType="standard"
    >

      {/* Route Polyline */}
      {polylineCoordinates.length > 1 && Polyline && (
        <Polyline
          coordinates={polylineCoordinates}
          strokeColor="#6366f1"
          strokeWidth={5}
          lineDashPattern={[0]}
        />
      )}

      {/* Start Location Marker */}
      {startLocation && startLocation.latitude && Marker && (
        <Marker
          coordinate={{
            latitude: startLocation.latitude,
            longitude: startLocation.longitude,
          }}
          title="Start Location"
          description={startLocation.name || 'Trip Origin'}
          pinColor="#10b981"
        />
      )}

      {/* Destination Marker */}
      {destination && destination.latitude && Marker && (
        <Marker
          coordinate={{
            latitude: destination.latitude,
            longitude: destination.longitude,
          }}
          title="Destination"
          description={destination.name || 'Target Location'}
          pinColor="#ef4444"
        />
      )}

      {/* Live Current Location Marker if not default */}
      {userLocation && Marker && (
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title="Current Position"
          pinColor="#6366f1"
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webFallbackContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  webFallbackHeader: {
    padding: 16,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  webFallbackTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  webFallbackSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  webMapCanvas: {
    flex: 1,
    minHeight: 250,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  webGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  userDotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  pulseRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
  },
  webPathBadge: {
    position: 'absolute',
    top: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  webPathText: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '600',
  },
  pinBadge: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pinText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  }
});
