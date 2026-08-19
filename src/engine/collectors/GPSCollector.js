import * as Location from 'expo-location';
import { BaseCollector } from './BaseCollector.js';

export class GPSCollector extends BaseCollector {
  constructor() {
    super('gps');
    this.latestPoint = null;
    this.locationSubscription = null;
  }

  async isAvailable() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      console.warn('[GPSCollector] Permission error:', e);
      return false;
    }
  }

  async start() {
    const hasPermission = await this.isAvailable();
    if (!hasPermission) {
      throw new Error('GPS permission not granted');
    }

    this.isRecording = true;

    // Get immediate initial fix
    try {
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      this._updateFromLocation(initialLocation);
    } catch (err) {
      console.warn('[GPSCollector] Initial location fetch failed, waiting for watch updates:', err);
    }

    // Subscribe to continuous location updates
    this.locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 2500, // sample every 2.5s for battery-optimized smoothness
        distanceFilter: 3,   // sample every 3 meters
      },
      (location) => {
        this._updateFromLocation(location);
      }
    );
  }

  _updateFromLocation(location) {
    if (!location || !location.coords) return;
    const { latitude, longitude, speed, heading } = location.coords;
    
    this.latestPoint = {
      latitude: latitude || 0,
      longitude: longitude || 0,
      speed: speed !== null && speed >= 0 ? speed : 0,
      heading: heading !== null && heading >= 0 ? heading : 0,
      timestamp: location.timestamp || Date.now(),
    };
  }

  getDataPoint() {
    return this.latestPoint;
  }

  async stop() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.isRecording = false;
  }
}
