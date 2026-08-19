/**
 * Abstract Base Class / Contract for Data Collectors.
 * Any collector (GPS, Sensor, OBD, etc.) must implement this interface.
 * RecordingEngine only interacts with methods defined on this base interface.
 */
export class BaseCollector {
  constructor(name) {
    if (new.target === BaseCollector) {
      throw new TypeError("Cannot construct BaseCollector instances directly.");
    }
    this.name = name;
    this.isRecording = false;
  }

  /**
   * Initialize resources and start sampling data points.
   */
  async start() {
    throw new Error("Collector method 'start()' must be implemented.");
  }

  /**
   * Stop sampling data points and release hardware resources.
   */
  async stop() {
    throw new Error("Collector method 'stop()' must be implemented.");
  }

  /**
   * Fetch the current sampled data payload.
   * @returns {Object|null} Collected data object or null if unavailable.
   */
  getDataPoint() {
    throw new Error("Collector method 'getDataPoint()' must be implemented.");
  }

  /**
   * Check if collector is supported and has required permissions.
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    return true;
  }
}
