import { useState, useEffect, useCallback } from 'react';
import type { AuthenticatedRequest } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import type { Post } from '../models/posts';

export interface User {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
    pendingInvites: string[]; // Array of group IDs
    savedPapers: string[]; // Array of paper IDs
    role: string;
    permissions: string[];
    createdAt: string;
    updatedAt?: string;
}

export interface UpdateProfileData {
    displayName?: string;
    photoURL?: string;
}

// Static methods for user operations
export const UserModel = {
    async get(makeAuthenticatedRequest: AuthenticatedRequest, userId: string): Promise<User> {
        const response = await makeAuthenticatedRequest(`/api/users/${userId}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to fetch user');
        }

        const result = await response.json();
        return result.data;
    },
    async updateProfile(makeAuthenticatedRequest: AuthenticatedRequest, data: UpdateProfileData): Promise<User> {
        const response = await makeAuthenticatedRequest('/api/users/me', {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to update profile');
        }

        const result = await response.json();
        return result.data;
    },
    async getCurrentUser(makeAuthenticatedRequest: AuthenticatedRequest): Promise<User> {
        const response = await makeAuthenticatedRequest('/api/users/me');
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to fetch current user');
        }

        const result = await response.json();
        return result.data;
    },

    async getPendingInvites(makeAuthenticatedRequest: AuthenticatedRequest): Promise<string[]> {
        const user = await this.getCurrentUser(makeAuthenticatedRequest);
        return user.pendingInvites || [];
    },

    async getSavedPapers(makeAuthenticatedRequest: AuthenticatedRequest): Promise<Post[]> {
        const response = await makeAuthenticatedRequest('/api/users/me/saved-papers');
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to fetch saved papers');
        }

        const result = await response.json();
        return result.data;
    }
};

// Hook for managing current user data
export function useCurrentUser() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const { makeAuthenticatedRequest, currentUser: authUser } = useAuth();

    const fetchUser = useCallback(async () => {
        if (!makeAuthenticatedRequest || !authUser) return;

        try {
            setLoading(true);
            setError(null);
            const userData = await UserModel.getCurrentUser(makeAuthenticatedRequest);
            setUser(userData);
        } catch (err) {
            console.error('Error fetching user:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch user'));
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [makeAuthenticatedRequest, authUser]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    return { user, loading, error, refresh: fetchUser };
}

// Hook for managing user's pending invites
export function usePendingInvites() {
    const [pendingInvites, setPendingInvites] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const { makeAuthenticatedRequest } = useAuth();

    const fetchInvites = useCallback(async () => {
        if (!makeAuthenticatedRequest) return;

        try {
            setLoading(true);
            setError(null);
            const invites = await UserModel.getPendingInvites(makeAuthenticatedRequest);
            setPendingInvites(invites);
        } catch (err) {
            console.error('Error fetching invites:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch invites'));
            setPendingInvites([]);
        } finally {
            setLoading(false);
        }
    }, [makeAuthenticatedRequest]);

    useEffect(() => {
        fetchInvites();
    }, [fetchInvites]);

    return { pendingInvites, loading, error, refresh: fetchInvites };
}

// Hook for managing user profile
export function useUserProfile() {
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const { makeAuthenticatedRequest, currentUser } = useAuth();

    const fetchProfile = useCallback(async () => {
        if (!makeAuthenticatedRequest || !currentUser) return;

        try {
            setLoading(true);
            setError(null);
            const userData = await UserModel.getCurrentUser(makeAuthenticatedRequest);
            setProfile(userData);
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, [makeAuthenticatedRequest, currentUser]);

    const updateProfile = useCallback(async (data: UpdateProfileData) => {
        if (!makeAuthenticatedRequest) return;

        try {
            const updatedProfile = await UserModel.updateProfile(makeAuthenticatedRequest, data);
            setProfile(updatedProfile);
            return updatedProfile;
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to update profile');
        }
    }, [makeAuthenticatedRequest]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return { profile, loading, error, updateProfile, refresh: fetchProfile };
}

interface SavedPaperResult {
    success: boolean;
    message: string;
    isSaved: boolean;
}


// Hook for managing saved papers toggle
export function useSavedPapers() {
    const { makeAuthenticatedRequest } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const toggleSavedPaper = useCallback(async (paperId: string): Promise<SavedPaperResult> => {
        if (!makeAuthenticatedRequest) {
            throw new Error('Authentication required');
        }

        try {
            setLoading(true);
            setError(null);
            const response = await makeAuthenticatedRequest('/api/users/me/saved-papers', {
                method: 'POST',
                body: JSON.stringify({ paperId })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to toggle saved paper');
            }

            const result = await response.json();
            return result as SavedPaperResult;
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to toggle saved paper');
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [makeAuthenticatedRequest]);

    return { toggleSavedPaper, loading, error };
}

// Hook for fetching saved papers
export function useSavedPapersData() {
    const { makeAuthenticatedRequest } = useAuth();
    const [papers, setPapers] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSavedPapers = useCallback(async () => {
        if (!makeAuthenticatedRequest) return;

        try {
            setLoading(true);
            setError(null);
            const savedPapers = await UserModel.getSavedPapers(makeAuthenticatedRequest);
            setPapers(savedPapers);
        } catch (err) {
            console.error('Error fetching saved papers:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch saved papers'));
            setPapers([]);
        } finally {
            setLoading(false);
        }
    }, [makeAuthenticatedRequest]);

    useEffect(() => {
        fetchSavedPapers();
    }, [fetchSavedPapers]);

    return { papers, loading, error, refresh: fetchSavedPapers };
}
