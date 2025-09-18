import { useState, useEffect, useCallback } from 'react';
import type { AuthenticatedRequest } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

export interface Group {
    id: string;
    name: string;
    description: string;
    photoURL: string | null;
    members: string[];
    admins: string[];
    createdAt: string;
    createdBy: string;
    updatedAt: string;
}

export interface CreateGroupData {
    name: string;
    description?: string;
    photoURL?: string;
}

export interface UpdateGroupData {
    name?: string;
    description?: string;
    photoURL?: string;
}

// Static methods for group operations
export const GroupModel = {
    async create(makeAuthenticatedRequest: AuthenticatedRequest, data: CreateGroupData): Promise<Group> {
        console.log('Creating group with data:', data);
        const response = await makeAuthenticatedRequest('/api/groups', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to create group:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            throw new Error(errorText || 'Failed to create group');
        }

        const result = await response.json();
        console.log('Group created successfully:', result.data);
        return result.data;
    },

    async get(makeAuthenticatedRequest: AuthenticatedRequest, id: string, skipMemberCheck: boolean = false): Promise<Group> {
        console.log('Fetching group:', id);
        const endpoint = skipMemberCheck ? `/api/groups/${id}/public` : `/api/groups/${id}`;
        const response = await makeAuthenticatedRequest(endpoint);

        const data = await response.json();
        
        if (!response.ok) {
            console.error('Failed to fetch group:', {
                status: response.status,
                statusText: response.statusText,
                error: data.error
            });
            throw new Error(data.error || 'Failed to fetch group');
        }

        console.log('Group fetched successfully:', data.data);
        return data.data;
    },

    async getAll(makeAuthenticatedRequest: AuthenticatedRequest): Promise<Group[]> {
        console.log('Fetching all groups');
        const response = await makeAuthenticatedRequest('/api/groups');

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch groups:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            throw new Error(errorText || 'Failed to fetch groups');
        }

        const result = await response.json();
        console.log('Groups fetched successfully:', result.data);
        return result.data;
    },

    async update(makeAuthenticatedRequest: AuthenticatedRequest, id: string, data: UpdateGroupData): Promise<Group> {
        console.log('Updating group:', { id, data });
        const response = await makeAuthenticatedRequest(`/api/groups/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to update group:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            throw new Error(errorText || 'Failed to update group');
        }

        const result = await response.json();
        console.log('Group updated successfully:', result.data);
        return result.data;
    },

    async delete(makeAuthenticatedRequest: AuthenticatedRequest, id: string): Promise<void> {
        const response = await makeAuthenticatedRequest(`/api/groups/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete group');
        }
    },

    async getInvites(makeAuthenticatedRequest: AuthenticatedRequest): Promise<string[]> {
        const response = await makeAuthenticatedRequest('/api/users/me');
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to fetch user invites');
        }

        const result = await response.json();
        return result.data.pendingInvites || [];
    },

    async acceptInvite(makeAuthenticatedRequest: AuthenticatedRequest, groupId: string): Promise<void> {
        const response = await makeAuthenticatedRequest(`/api/groups/${groupId}/accept-invite`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to accept group invite');
        }
    },

    async rejectInvite(makeAuthenticatedRequest: AuthenticatedRequest, groupId: string): Promise<void> {
        const response = await makeAuthenticatedRequest(`/api/groups/${groupId}/reject-invite`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to reject group invite');
        }
    }
};

// Hook for managing groups list
export function useGroups() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const { makeAuthenticatedRequest, currentUser } = useAuth();

    const fetchGroups = useCallback(async () => {
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

    // Initial fetch
    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]); // Only depend on the memoized fetch function

    return { groups, loading, error, refresh: fetchGroups };
}

// Hook for managing single group
export function useGroup(id: string) {
    const [group, setGroup] = useState<Group | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const { makeAuthenticatedRequest, currentUser } = useAuth();

    const fetchGroup = useCallback(async () => {
        if (!makeAuthenticatedRequest || !currentUser || !id) {
            console.log('Skipping group fetch - missing dependencies:', { 
                hasAuth: !!makeAuthenticatedRequest, 
                userId: currentUser?.uid,
                groupId: id
            });
            return;
        }

        try {
            console.log('Fetching group:', id, 'for user:', currentUser.uid);
            setLoading(true);
            setError(null);
            const fetchedGroup = await GroupModel.get(makeAuthenticatedRequest, id);
            console.log('Fetched group:', fetchedGroup);
            setGroup(fetchedGroup);
        } catch (err) {
            console.error('Error in useGroup:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch group'));
            setGroup(null); // Reset group on error
        } finally {
            setLoading(false);
        }
    }, [makeAuthenticatedRequest, currentUser, id]);

    useEffect(() => {
        fetchGroup();
    }, [fetchGroup]); // Only depend on the memoized fetch function

    const updateGroup = useCallback(async (data: UpdateGroupData) => {
        if (!id || !makeAuthenticatedRequest) return;

        try {
            setError(null);
            const updatedGroup = await GroupModel.update(makeAuthenticatedRequest, id, data);
            setGroup(updatedGroup);
            return updatedGroup;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to update group'));
            throw err;
        }
    }, [id, makeAuthenticatedRequest]);

    return { group, loading, error, updateGroup };
}

// Hook for managing group invites
export function useGroupInvites() {
    const [invites, setInvites] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const { makeAuthenticatedRequest } = useAuth();

    const fetchInvites = useCallback(async () => {
        if (!makeAuthenticatedRequest) return;

        try {
            setLoading(true);
            setError(null);
            
            // Get the list of group IDs the user is invited to
            const inviteIds = await GroupModel.getInvites(makeAuthenticatedRequest);
            
            // Fetch full group details for each invite
            const groupPromises = inviteIds.map(id => GroupModel.get(makeAuthenticatedRequest, id));
            const groups = await Promise.all(groupPromises);
            
            setInvites(groups);
        } catch (err) {
            console.error('Error fetching invites:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch invites'));
            setInvites([]);
        } finally {
            setLoading(false);
        }
    }, [makeAuthenticatedRequest]);

    const acceptInvite = useCallback(async (groupId: string) => {
        if (!makeAuthenticatedRequest) return;

        try {
            await GroupModel.acceptInvite(makeAuthenticatedRequest, groupId);
            await fetchInvites(); // Refresh the invites list
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to accept invite');
        }
    }, [makeAuthenticatedRequest, fetchInvites]);

    const rejectInvite = useCallback(async (groupId: string) => {
        if (!makeAuthenticatedRequest) return;

        try {
            await GroupModel.rejectInvite(makeAuthenticatedRequest, groupId);
            await fetchInvites(); // Refresh the invites list
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to reject invite');
        }
    }, [makeAuthenticatedRequest, fetchInvites]);

    useEffect(() => {
        fetchInvites();
    }, [fetchInvites]);

    return { invites, loading, error, acceptInvite, rejectInvite, refresh: fetchInvites };
}