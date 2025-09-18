import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../models/users';
import { UserModel } from '../models/users';
import { useAuth } from './AuthContext';

interface UserContextType {
    currentUser: User | null;
    pendingInvites: string[];
    loading: boolean;
    error: Error | null;
    refreshUser: () => Promise<void>;
    updateUser: (updates: Partial<User>) => Promise<void>;
    addInvite: (groupId: string) => void;
    removeInvite: (groupId: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [pendingInvites, setPendingInvites] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { makeAuthenticatedRequest, claimsSynced } = useAuth();

    const refreshUser = useCallback(async () => {
        if (!makeAuthenticatedRequest || !claimsSynced) return;

        try {
            setLoading(true);
            setError(null);
            const userData = await UserModel.getCurrentUser(makeAuthenticatedRequest);
            setCurrentUser(userData);
            setPendingInvites(userData.pendingInvites || []);
        } catch (err) {
            console.error('Error fetching user:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch user'));
            setCurrentUser(null);
            setPendingInvites([]);
        } finally {
            setLoading(false);
        }
    }, [makeAuthenticatedRequest, claimsSynced]);

    // Update user data
    const updateUser = useCallback(async (updates: Partial<User>) => {
        if (!makeAuthenticatedRequest || !currentUser) return;

        try {
            // Convert null values to undefined to match UpdateProfileData type
            const cleanUpdates = Object.fromEntries(
                Object.entries(updates).map(([key, value]) => [key, value === null ? undefined : value])
            );
            const updatedUser = await UserModel.updateProfile(makeAuthenticatedRequest, cleanUpdates);
            setCurrentUser(updatedUser);
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to update user');
        }
    }, [makeAuthenticatedRequest, currentUser]);

    // Add a group invite
    const addInvite = useCallback((groupId: string) => {
        setPendingInvites(prev => {
            if (prev.includes(groupId)) return prev;
            return [...prev, groupId];
        });
    }, []);

    // Remove a group invite
    const removeInvite = useCallback((groupId: string) => {
        setPendingInvites(prev => prev.filter(id => id !== groupId));
    }, []);

    // Initial fetch
    React.useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const value = {
        currentUser,
        pendingInvites,
        loading,
        error,
        refreshUser,
        updateUser,
        addInvite,
        removeInvite
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};
