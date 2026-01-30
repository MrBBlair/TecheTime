/**
 * AuthContext: Firebase Auth with Super Admin impersonation support
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
  signInWithCustomToken,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, Business } from '@shared/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  businesses: Business[];
  selectedBusinessId: string | null;
  setSelectedBusinessId: (id: string) => void;
  business: Business | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  impersonateUser: (customToken: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  getAuthHeaders: (includeContentType?: boolean) => Promise<HeadersInit>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserData({ id: userDoc.id, ...userDoc.data() } as User);
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Store token for API requests
        const token = await firebaseUser.getIdToken();
        localStorage.setItem('auth_token', token);
        await fetchUserData(firebaseUser.uid);
      } else {
        localStorage.removeItem('auth_token');
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    localStorage.setItem('auth_token', token);
    await fetchUserData(userCredential.user.uid);
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('kiosk_secret');
    localStorage.removeItem('kiosk_device_id');
    setUserData(null);
  };

  const impersonateUser = async (customToken: string) => {
    const userCredential = await signInWithCustomToken(auth, customToken);
    const token = await userCredential.user.getIdToken();
    localStorage.setItem('auth_token', token);
    await fetchUserData(userCredential.user.uid);
  };

  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user.uid);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!auth.currentUser?.email) throw new Error('Not signed in');
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updatePassword(auth.currentUser, newPassword);
  };

  const getAuthHeaders = async (includeContentType = true): Promise<HeadersInit> => {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (includeContentType) headers['Content-Type'] = 'application/json';
    return headers;
  };

  const businesses: Business[] = userData?.businessId
    ? [{ id: userData.businessId, name: 'My Business', ownerId: userData.id, createdAt: '', updatedAt: '' }]
    : [];
  const selectedBusinessId = userData?.businessId ?? null;
  const setSelectedBusinessId = () => {};
  const business: Business | null = userData?.businessId
    ? { id: userData.businessId, name: 'My Business', ownerId: userData.id, createdAt: '', updatedAt: '' }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        businesses,
        selectedBusinessId,
        setSelectedBusinessId,
        business,
        loading,
        login,
        logout,
        impersonateUser,
        refreshUserData,
        changePassword,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
