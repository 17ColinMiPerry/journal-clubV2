import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';

export type AuthenticatedRequest = (endpoint: string, options?: RequestInit) => Promise<Response>;
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';


interface AuthContextType {
  currentUser: User | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  claimsSynced: boolean;
  syncClaims: () => Promise<void>;
  makeAuthenticatedRequest: (endpoint: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimsSynced, setClaimsSynced] = useState(false);

  const syncClaims = async (user?: User) => {
    const userToSync = user || currentUser;
    if (!userToSync) {
      throw new Error('No user signed in');
    }

    try {
      // Get current token to send to backend
      const token = await userToSync.getIdToken();
      
      // Call backend to sync claims
      const response = await fetch('http://localhost:3001/api/auth/sync-claims', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to sync claims');
      }

      // Force refresh token to get new claims
      await userToSync.getIdToken(true);
      
      setClaimsSynced(true);
      console.log('✅ Claims synced successfully');
    } catch (error) {
      console.error('❌ Error syncing claims:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Claims will be synced automatically in the useEffect below, which will also create the user if needed
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const makeAuthenticatedRequest = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    if (!currentUser) {
      throw new Error('No user signed in');
    }

    const makeRequest = async (token: string): Promise<Response> => {
      return fetch(`http://localhost:3001${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
    };

    try {
      // First attempt with current token
      const token = await currentUser.getIdToken();
      const response = await makeRequest(token);

      // If auth error (403 or 401), try to refresh claims and retry
      if ((response.status === 403 || response.status === 401)) {
        const errorText = await response.text();
        
        // Check if it's a claims-related error
        if (errorText.includes('role') || errorText.includes('permission') || errorText.includes('claims')) {
          console.log('🔄 Auth error detected, refreshing claims and retrying...');
          
          try {
            // Sync claims and get fresh token
            await syncClaims(currentUser);
            const freshToken = await currentUser.getIdToken(true);
            
            // Retry with fresh token
            const retryResponse = await makeRequest(freshToken);
            console.log('✅ Retry with fresh claims succeeded');
            return retryResponse;
          } catch (retryError) {
            console.log('❌ Retry with fresh claims failed, this is a real permission issue');
            // Return the original response if retry fails
            return new Response(errorText, { 
              status: response.status, 
              statusText: response.statusText 
            });
          }
        }
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // User just signed in, automatically sync claims
        // Pass the user directly to avoid state timing issues
        setTimeout(() => {
          syncClaims(user).catch(error => {
            console.error('Failed to auto-sync claims:', error);
          });
        }, 1000);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    signInWithGoogle,
    logout,
    loading,
    claimsSynced,
    syncClaims,
    makeAuthenticatedRequest
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 