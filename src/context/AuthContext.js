import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        if (firebaseUser.isAnonymous) {
          setIsGuest(true);
          setUser({
            uid: firebaseUser.uid,
            name: 'Guest User',
            email: 'guest@smartnav.local',
            isAnonymous: true
          });
        } else {
          setIsGuest(false);
          // Fetch additional user info from Firestore Users collection
          try {
            const userDocRef = doc(db, 'Users', firebaseUser.uid);
            const userSnap = await getDoc(userDocRef);
            
            if (userSnap.exists()) {
              setUser({
                uid: firebaseUser.uid,
                ...userSnap.data()
              });
            } else {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0]
              });
            }
          } catch (err) {
            console.warn('Could not fetch user doc from Firestore, using auth fallback:', err);
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || firebaseUser.email.split('@')[0]
            });
          }
        }
      } else {
        setUser(null);
        setIsGuest(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Module 1: Login
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      return res.user;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  // Module 1: Signup (Creates corresponding Users document)
  const signup = async (name, email, password) => {
    setAuthError(null);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = res.user;
      
      await updateProfile(newUser, { displayName: name });

      // Create Users document per Section 5 Schema
      const userDocRef = doc(db, 'Users', newUser.uid);
      await setDoc(userDocRef, {
        name: name,
        email: email,
        createdAt: serverTimestamp()
      });

      setUser({
        uid: newUser.uid,
        name: name,
        email: email
      });

      return newUser;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  // Module 1: Google Login
  const loginWithGoogle = async (idToken) => {
    setAuthError(null);
    try {
      let resUser;
      if (idToken) {
        // Native Google Credential authentication
        const credential = GoogleAuthProvider.credential(idToken);
        const res = await signInWithCredential(auth, credential);
        resUser = res.user;
      } else if (typeof signInWithPopup === 'function' && Platform.OS === 'web') {
        // Web Firebase Google Popup
        const provider = new GoogleAuthProvider();
        const res = await signInWithPopup(auth, provider);
        resUser = res.user;
      } else {
        throw new Error('Google Sign-In via popup is not supported in mobile Expo Go without native OAuth credentials. Please use Email Sign In or Guest Mode.');
      }

      // Sync Firestore user profile
      const userDocRef = doc(db, 'Users', resUser.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          name: resUser.displayName || 'Google User',
          email: resUser.email,
          createdAt: serverTimestamp(),
          provider: 'google'
        });
      }

      setUser({
        uid: resUser.uid,
        name: resUser.displayName || resUser.email.split('@')[0],
        email: resUser.email
      });

      return resUser;
    } catch (error) {
      console.error('Google Sign-In error:', error);
      setAuthError(error.message);
      throw error;
    }
  };

  // Module 1: Guest Mode
  const loginAsGuest = async () => {
    setAuthError(null);
    try {
      let res;
      try {
        res = await signInAnonymously(auth);
      } catch (e) {
        // Fallback for offline guest mode if firebase anonymous auth fails
        const mockGuestUid = 'guest_' + Date.now();
        setIsGuest(true);
        setUser({
          uid: mockGuestUid,
          name: 'Guest Traveler',
          email: 'guest@local.device',
          isAnonymous: true
        });
        return { uid: mockGuestUid };
      }
      setIsGuest(true);
      return res.user;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  // Logout
  const logoutUser = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Signout error:', e);
    }
    setUser(null);
    setIsGuest(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        loading,
        authError,
        login,
        signup,
        loginWithGoogle,
        loginAsGuest,
        logout: logoutUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
