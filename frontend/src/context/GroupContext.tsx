import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Group } from '../models/groups';
import { GroupModel } from '../models/groups';
import { useAuth } from './AuthContext';

interface GroupContextType {
    groups: Group[];
    loading: boolean;
    error: Error | null;
    refreshGroups: () => Promise<void>;
    addGroup: (group: Group) => void;
    updateGroup: (groupId: string, updatedGroup: Group) => void;
    removeGroup: (groupId: string) => void;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const useGroups = () => {
    const context = useContext(GroupContext);
    if (context === undefined) {
        throw new Error('useGroups must be used within a GroupProvider');
    }
    return context;
};

interface GroupProviderProps {
    children: ReactNode;
}

export const GroupProvider: React.FC<GroupProviderProps> = ({ children }) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { makeAuthenticatedRequest, currentUser } = useAuth();

    const refreshGroups = useCallback(async () => {
        if (!makeAuthenticatedRequest || !currentUser) {
            console.log('Skipping groups fetch - no auth or user:', { 
                hasAuth: !!makeAuthenticatedRequest, 
                userId: currentUser?.uid 
            });
            return;
        }
        
        try {
            console.log('Fetching groups for user:', currentUser.uid);
            setLoading(true);
            setError(null);
            const fetchedGroups = await GroupModel.getAll(makeAuthenticatedRequest);
            console.log('Fetched groups:', fetchedGroups);
            setGroups(fetchedGroups);
        } catch (err) {
            console.error('Error in useGroups:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch groups'));
            setGroups([]); // Reset groups on error
        } finally {
            setLoading(false);
        }
    }, [makeAuthenticatedRequest, currentUser]);

    // Add a new group to the list
    const addGroup = useCallback((group: Group) => {
        setGroups(prev => [...prev, group]);
    }, []);

    // Update an existing group
    const updateGroup = useCallback((groupId: string, updatedGroup: Group) => {
        setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
    }, []);

    // Remove a group from the list
    const removeGroup = useCallback((groupId: string) => {
        setGroups(prev => prev.filter(g => g.id !== groupId));
    }, []);

    // Initial fetch
    React.useEffect(() => {
        refreshGroups();
    }, [refreshGroups]);

    const value = {
        groups,
        loading,
        error,
        refreshGroups,
        addGroup,
        updateGroup,
        removeGroup
    };

    return (
        <GroupContext.Provider value={value}>
            {children}
        </GroupContext.Provider>
    );
};
