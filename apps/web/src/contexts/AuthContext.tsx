import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { apiUrl } from '../utils/api';
import type { User, Business } from '@techetime/shared';

interface AuthContextType {
  user: User | null;
  business: Business | null;
  businesses: Business[]; // All businesses user belongs to
  selectedBusinessId: string | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, businessName: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  setSelectedBusinessId: (businessId: string) => void;
  refreshBusinesses: () => Promise<void>;
  getAuthHeaders: (includeContentType?: boolean) => Promise<HeadersInit>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Firebase auth is not initialized, skip auth state listener
    if (!auth) {
      console.warn('Firebase auth not initialized - skipping auth state listener');
      setLoading(false);
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    // Set a timeout to ensure loading doesn't get stuck forever
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth state change timeout - setting loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!isMounted) return;
        
        clearTimeout(timeoutId);
        setFirebaseUser(firebaseUser);
        setLoading(true); // Set loading while processing auth state change
        
        try {
          if (firebaseUser) {
            await loadUserData(firebaseUser.uid);
          } else {
            setUser(null);
            setBusiness(null);
            setBusinesses([]);
            setSelectedBusinessIdState(null);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          // Clear user state on error to prevent inconsistent state
          setUser(null);
          setBusiness(null);
          setBusinesses([]);
          setSelectedBusinessIdState(null);
        } finally {
          if (isMounted) {
            setLoading(false); // Always set loading to false
          }
        }
      },
      (error) => {
        // Handle auth state change errors
        console.error('Auth state change error:', error);
        if (isMounted) {
          clearTimeout(timeoutId);
          setLoading(false);
          setUser(null);
          setBusiness(null);
          setBusinesses([]);
          setSelectedBusinessIdState(null);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const loadUserData = async (userId: string) => {
    if (!db) {
      console.error('Firestore is not initialized. Cannot load user data.');
      setUser(null);
      setBusiness(null);
      setBusinesses([]);
      setSelectedBusinessIdState(null);
      return;
    }
    
    try {
      // TypeScript narrowing - db is guaranteed to be non-null here
      const firestoreDb = db;
      const userDoc = await getDoc(doc(firestoreDb, 'users', userId));
      if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      setUser(userData);
      
      // Support both old (businessId) and new (businessIds) formats
      const businessIds = userData.businessIds || (userData.businessId ? [userData.businessId] : []);
      
      // Load all businesses user belongs to
      if (businessIds.length > 0) {
        const businessPromises = businessIds.map(bid => getDoc(doc(firestoreDb, 'businesses', bid)));
        const businessDocs = await Promise.all(businessPromises);
        const loadedBusinesses = businessDocs
          .filter(doc => doc.exists())
          .map(doc => ({ id: doc.id, ...doc.data() } as Business));
        
        setBusinesses(loadedBusinesses);
        
        // Set selected business (default, first, or from localStorage)
        const savedBusinessId = localStorage.getItem('selectedBusinessId');
        const defaultBusinessId = userData.defaultBusinessId || businessIds[0] || userData.businessId;
        const selectedId = savedBusinessId && businessIds.includes(savedBusinessId) 
          ? savedBusinessId 
          : defaultBusinessId;
        
        setSelectedBusinessIdState(selectedId);
        const selectedBusiness = loadedBusinesses.find(b => b.id === selectedId) || loadedBusinesses[0] || null;
        setBusiness(selectedBusiness);
      } else {
        // SUPERADMIN users might not have businesses assigned
        // This is normal and expected
        setBusinesses([]);
        setBusiness(null);
        setSelectedBusinessIdState(null);
      }
      } else {
        // User document doesn't exist
        console.warn('User document not found for userId:', userId);
        setUser(null);
        setBusiness(null);
        setBusinesses([]);
        setSelectedBusinessIdState(null);
      }
    } catch (error: any) {
      console.error('Error loading user data:', error);
      // Handle permission errors more gracefully
      if (error.code === 'permission-denied') {
        console.error('Permission denied when loading user data. Check Firestore security rules.');
        // Still set user to null to prevent inconsistent state
        setUser(null);
        setBusiness(null);
        setBusinesses([]);
        setSelectedBusinessIdState(null);
        throw new Error('Permission denied. Please contact support if this issue persists.');
      }
      throw error;
    }
  };

  const setSelectedBusinessId = (businessId: string) => {
    // SUPERADMIN can select any business
    if (user?.role === 'SUPERADMIN') {
      setSelectedBusinessIdState(businessId);
      localStorage.setItem('selectedBusinessId', businessId);
      
      // Try to find business in loaded businesses, or load it
      const selectedBusiness = businesses.find(b => b.id === businessId);
      if (selectedBusiness) {
        setBusiness(selectedBusiness);
      } else if (db) {
        // Load the business if not already loaded
        getDoc(doc(db, 'businesses', businessId)).then(businessDoc => {
          if (businessDoc.exists()) {
            setBusiness({ id: businessDoc.id, ...businessDoc.data() } as Business);
          }
        }).catch(err => {
          console.error('Error loading business:', err);
        });
      }
      return;
    }
    
    // Support both old (businessId) and new (businessIds) formats
    const userBusinessIds = user?.businessIds || (user?.businessId ? [user.businessId] : []);
    if (!userBusinessIds.includes(businessId)) {
      console.error('User does not have access to business:', businessId);
      return;
    }
    
    setSelectedBusinessIdState(businessId);
    localStorage.setItem('selectedBusinessId', businessId);
    
    const selectedBusiness = businesses.find(b => b.id === businessId);
    if (selectedBusiness) {
      setBusiness(selectedBusiness);
    }
  };

  const refreshBusinesses = async () => {
    if (firebaseUser) {
      await loadUserData(firebaseUser.uid);
    }
  };

  const getAuthHeaders = async (includeContentType = false): Promise<HeadersInit> => {
    const headers: HeadersInit = {};
    
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Add business context header if available
    if (selectedBusinessId) {
      headers['X-Business-Id'] = selectedBusinessId;
    }
    
    // Add auth token - this is required for all API calls
    if (!firebaseUser) {
      console.warn('getAuthHeaders: No firebaseUser available');
      throw new Error('User not authenticated. Please log in again.');
    }
    
    try {
      const token = await firebaseUser.getIdToken();
      if (!token) {
        console.error('getAuthHeaders: Failed to get ID token');
        throw new Error('Failed to get authentication token. Please log in again.');
      }
      headers['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error('getAuthHeaders: Error getting ID token:', error);
      throw new Error('Failed to get authentication token. Please log in again.');
    }
    
    return headers;
  };

  const login = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase authentication is not initialized. Please check your Firebase configuration.');
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await loadUserData(userCredential.user.uid);
    } catch (error: any) {
      console.error('Login error:', error);
      // Provide more specific error messages
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address format.');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled. Please contact support.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      } else {
        throw new Error(error.message || 'Login failed. Please try again.');
      }
    }
  };

  const register = async (email: string, password: string, businessName: string, firstName: string, lastName: string) => {
    if (!auth) {
      throw new Error('Firebase authentication is not initialized. Please check your Firebase configuration.');
    }

    let firebaseUser: FirebaseUser | null = null;

    try {
      // Step 1: Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUser = userCredential.user;

      // Step 2: Get ID token
      const token = await firebaseUser.getIdToken();

      // Step 3: Create business and user document via API
      const response = await fetch(apiUrl('/api/auth/register-business'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessName,
          ownerEmail: email,
          ownerPassword: password,
          ownerFirstName: firstName,
          ownerLastName: lastName,
          firebaseUid: firebaseUser.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Registration failed' }));
        const errorMessage = errorData.error || `Registration failed: ${response.status} ${response.statusText}`;
        
        // If API call fails, try to clean up the Firebase Auth user
        if (firebaseUser) {
          try {
            await firebaseUser.delete();
            console.log('Cleaned up orphaned Firebase Auth user');
          } catch (deleteError) {
            console.error('Failed to clean up Firebase Auth user:', deleteError);
          }
        }
        
        throw new Error(errorMessage);
      }

      // Step 4: Verify response (data is loaded from Firestore in next step)
      await response.json();

      // Step 5: Load user data into context
      // Wait a moment for Firestore to be consistent
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Load user data from Firestore (this ensures we have the latest data)
      await loadUserData(firebaseUser.uid);

      // Step 6: Verify user data was loaded
      if (!user) {
        // If user data still not loaded, wait a bit more and try again
        await new Promise(resolve => setTimeout(resolve, 1000));
        await loadUserData(firebaseUser.uid);
      }

    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please use a different email or try logging in.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address format.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use a stronger password.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/password accounts are not enabled. Please contact support.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.message) {
        // Use the error message from API or Firebase
        throw error;
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    }
  };

  const logout = async () => {
    if (!auth) {
      console.warn('Firebase auth not initialized - cannot logout');
      return;
    }
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      business, 
      businesses,
      selectedBusinessId,
      firebaseUser, 
      loading, 
      login, 
      register, 
      logout,
      setSelectedBusinessId,
      refreshBusinesses,
      getAuthHeaders
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
