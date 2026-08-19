import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase.js';

const LOCAL_TRIPS_KEY = '@smart_nav_local_trips';

export const tripService = {
  /**
   * Save recorded trip and route points to Firestore (or local storage for guests/offline)
   * 
   * Schema mapping strictly complies with Section 5:
   * Trips: userId, startLocation, destination, distance, duration, createdAt, usedSensorMode: false
   * RoutePoints: tripId, latitude, longitude, timestamp, speed, heading
   */
  async saveTrip({
    userId,
    startLocation,
    destination,
    distance,
    duration,
    routePoints = [],
    isGuest = false
  }) {
    const tripId = 'trip_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const createdAt = new Date().toISOString();

    const tripData = {
      tripId,
      userId: userId || 'guest_user',
      startLocation: startLocation || { name: 'Current Location', latitude: 0, longitude: 0 },
      destination: destination || { name: 'Destination', latitude: 0, longitude: 0 },
      distance: Math.round(distance || 0), // distance in meters
      duration: Math.round(duration || 0), // duration in seconds
      createdAt: createdAt,
      usedSensorMode: false // Reserved field required by Section 5 & Extensibility Rule 5
    };

    // If online non-guest (or Firebase guest auth enabled), save to Firestore
    try {
      if (db) {
        // 1. Create Trips Document
        const tripRef = doc(db, 'Trips', tripId);
        await setDoc(tripRef, {
          ...tripData,
          createdAt: serverTimestamp()
        });

        // 2. Batch Insert RoutePoints Documents
        if (routePoints && routePoints.length > 0) {
          const batchSize = 450; // Firestore batch max limit is 500
          for (let i = 0; i < routePoints.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = routePoints.slice(i, i + batchSize);
            
            chunk.forEach((pt) => {
              const pointRef = doc(collection(db, 'RoutePoints'));
              batch.set(pointRef, {
                tripId: tripId,
                latitude: pt.latitude,
                longitude: pt.longitude,
                timestamp: pt.timestamp || Date.now(),
                speed: pt.speed || 0,
                heading: pt.heading || 0
              });
            });
            await batch.commit();
          }
        }
        console.log(`[tripService] Saved trip ${tripId} to Firestore successfully.`);
      }
    } catch (error) {
      console.warn('[tripService] Firestore save error, saving locally as fallback:', error);
    }

    // Always cache locally as offline fallback / guest storage
    try {
      const existing = await AsyncStorage.getItem(LOCAL_TRIPS_KEY);
      const tripsArray = existing ? JSON.parse(existing) : [];
      
      const fullLocalTrip = {
        ...tripData,
        routePoints: routePoints
      };
      
      tripsArray.unshift(fullLocalTrip);
      await AsyncStorage.setItem(LOCAL_TRIPS_KEY, JSON.stringify(tripsArray));
    } catch (e) {
      console.error('[tripService] Local storage save error:', e);
    }

    return tripId;
  },

  /**
   * Fetch all past trips for a specific user
   */
  async getUserTrips(userId) {
    let firestoreTrips = [];
    
    try {
      if (db && userId && !userId.startsWith('guest_')) {
        const q = query(
          collection(db, 'Trips'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((docSnap) => {
          firestoreTrips.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });
      }
    } catch (err) {
      console.warn('[tripService] Firestore trips fetch error:', err);
    }

    // Combine with local cached trips
    try {
      const localData = await AsyncStorage.getItem(LOCAL_TRIPS_KEY);
      if (localData) {
        const localTrips = JSON.parse(localData);
        // Merge and deduplicate by tripId
        const tripMap = new Map();
        firestoreTrips.forEach((t) => tripMap.set(t.tripId || t.id, t));
        localTrips.forEach((t) => {
          const id = t.tripId || t.id;
          if (!tripMap.has(id)) {
            tripMap.set(id, t);
          }
        });
        return Array.from(tripMap.values());
      }
    } catch (e) {
      console.error('[tripService] Local storage fetch error:', e);
    }

    return firestoreTrips;
  },

  /**
   * Fetch specific trip details and its recorded RoutePoints for rendering path on map
   */
  async getTripDetails(tripId) {
    let trip = null;
    let routePoints = [];

    // First check local cache
    try {
      const localData = await AsyncStorage.getItem(LOCAL_TRIPS_KEY);
      if (localData) {
        const localTrips = JSON.parse(localData);
        const match = localTrips.find((t) => (t.tripId || t.id) === tripId);
        if (match) {
          trip = match;
          if (match.routePoints && match.routePoints.length > 0) {
            routePoints = match.routePoints;
          }
        }
      }
    } catch (e) {
      console.warn('[tripService] Local cache check failed:', e);
    }

    // If route points missing, fetch from Firestore RoutePoints collection
    if (routePoints.length === 0 && db) {
      try {
        if (!trip) {
          const tripDoc = await getDoc(doc(db, 'Trips', tripId));
          if (tripDoc.exists()) {
            trip = { id: tripDoc.id, ...tripDoc.data() };
          }
        }

        const q = query(
          collection(db, 'RoutePoints'),
          where('tripId', '==', tripId),
          orderBy('timestamp', 'asc')
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((docSnap) => {
          routePoints.push(docSnap.data());
        });
      } catch (err) {
        console.warn('[tripService] Firestore route points fetch error:', err);
      }
    }

    return {
      trip,
      routePoints
    };
  }
};
