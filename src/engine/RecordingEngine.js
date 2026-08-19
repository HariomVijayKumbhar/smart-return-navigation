import { calculateDistance } from '../utils/geo.js';

/**
 * Extensible RecordingEngine (Session Manager)
 * 
 * Manages active trip recording sessions without knowing the implementation
 * details of specific sensors or collectors. Holds a registry of collectors
 * and periodically triggers saveCollectorData() to capture telemetry snapshots.
 */
export class RecordingEngine {
  constructor() {
    this.registeredCollectors = new Map();
    this.isSessionActive = false;
    this.sessionId = null;
    this.startTime = null;
    this.timerId = null;
    this.recordedStream = [];
    this.totalDistanceMeters = 0;
    this.lastLocationCoords = null;
    this.tripMetadata = null;
    this.onUpdateCallbacks = new Set();
    this.samplingIntervalMs = 3000;
  }

  /**
   * Register a telemetry collector module.
   * @param {BaseCollector} collector 
   */
  registerCollector(collector) {
    if (!collector || !collector.name) {
      throw new Error("Invalid collector instance");
    }
    this.registeredCollectors.set(collector.name, collector);
    console.log(`[RecordingEngine] Registered collector: ${collector.name}`);
  }

  /**
   * Unregister a collector by name.
   */
  unregisterCollector(collectorName) {
    this.registeredCollectors.delete(collectorName);
  }

  /**
   * Subscribe to live session data stream updates (for UI rendering).
   */
  subscribe(callback) {
    this.onUpdateCallbacks.add(callback);
    return () => this.onUpdateCallbacks.delete(callback);
  }

  /**
   * Start a new recording session.
   * @param {Object} metadata (startLocation, destination, userId, etc.)
   */
  async startSession(metadata = {}) {
    if (this.isSessionActive) {
      console.warn('[RecordingEngine] Session already active.');
      return;
    }

    this.sessionId = 'trip_' + Date.now();
    this.startTime = Date.now();
    this.tripMetadata = metadata;
    this.recordedStream = [];
    this.totalDistanceMeters = 0;
    this.lastLocationCoords = null;

    // Start all registered collectors
    for (const [name, collector] of this.registeredCollectors.entries()) {
      try {
        await collector.start();
        console.log(`[RecordingEngine] Started collector: ${name}`);
      } catch (err) {
        console.error(`[RecordingEngine] Failed to start collector ${name}:`, err);
      }
    }

    this.isSessionActive = true;

    // Trigger initial snapshot immediately
    this.saveCollectorData();

    // Start periodic sampling loop
    this.timerId = setInterval(() => {
      this.saveCollectorData();
    }, this.samplingIntervalMs);

    this._notifyListeners();
  }

  /**
   * Periodic data ingestion method.
   * Asks each active collector for its current data point, combines them into
   * a unified sample, and updates distance/telemetry metrics.
   * Generic write function per Extensibility Rule 7.
   */
  saveCollectorData() {
    if (!this.isSessionActive) return;

    const sampleTimestamp = Date.now();
    const mergedSnapshot = {
      timestamp: sampleTimestamp,
      collectorsData: {}
    };

    // Query each active collector
    for (const [name, collector] of this.registeredCollectors.entries()) {
      if (collector.isRecording) {
        const point = collector.getDataPoint();
        if (point) {
          mergedSnapshot.collectorsData[name] = point;
        }
      }
    }

    // Extract spatial coordinates from 'gps' collector if available for distance & route calculations
    const gpsData = mergedSnapshot.collectorsData['gps'];
    if (gpsData && gpsData.latitude && gpsData.longitude) {
      if (this.lastLocationCoords) {
        const delta = calculateDistance(
          this.lastLocationCoords.latitude,
          this.lastLocationCoords.longitude,
          gpsData.latitude,
          gpsData.longitude
        );
        // Only accumulate reasonable movements (> 1 meter, < 200 meters jump)
        if (delta > 1 && delta < 200) {
          this.totalDistanceMeters += delta;
        }
      }
      this.lastLocationCoords = {
        latitude: gpsData.latitude,
        longitude: gpsData.longitude
      };
    }

    // Store standard RoutePoint payload format
    if (gpsData) {
      this.recordedStream.push({
        latitude: gpsData.latitude,
        longitude: gpsData.longitude,
        speed: gpsData.speed || 0,
        heading: gpsData.heading || 0,
        timestamp: sampleTimestamp
      });
    }

    this._notifyListeners();
  }

  /**
   * Stop recording session and clean up collectors.
   * @returns {Object} Session result summary and recorded points array.
   */
  async stopSession() {
    if (!this.isSessionActive) {
      return null;
    }

    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    // Save final sample
    this.saveCollectorData();

    // Stop all registered collectors
    for (const [name, collector] of this.registeredCollectors.entries()) {
      try {
        await collector.stop();
        console.log(`[RecordingEngine] Stopped collector: ${name}`);
      } catch (err) {
        console.error(`[RecordingEngine] Error stopping collector ${name}:`, err);
      }
    }

    this.isSessionActive = false;
    const durationSeconds = Math.round((Date.now() - this.startTime) / 1000);

    const sessionSummary = {
      sessionId: this.sessionId,
      startTime: this.startTime,
      duration: durationSeconds,
      distance: this.totalDistanceMeters,
      routePoints: [...this.recordedStream],
      tripMetadata: this.tripMetadata
    };

    this._notifyListeners();
    return sessionSummary;
  }

  /**
   * Return current live session state.
   */
  getSessionState() {
    const elapsedSeconds = this.startTime ? Math.round((Date.now() - this.startTime) / 1000) : 0;
    return {
      isSessionActive: this.isSessionActive,
      sessionId: this.sessionId,
      duration: elapsedSeconds,
      distance: this.totalDistanceMeters,
      pointsCount: this.recordedStream.length,
      latestPoint: this.recordedStream[this.recordedStream.length - 1] || null,
      recordedStream: [...this.recordedStream]
    };
  }

  _notifyListeners() {
    const state = this.getSessionState();
    for (const cb of this.onUpdateCallbacks) {
      try {
        cb(state);
      } catch (e) {
        console.error('[RecordingEngine] Listener error:', e);
      }
    }
  }
}

// Global Singleton Instance of RecordingEngine
export const globalRecordingEngine = new RecordingEngine();
