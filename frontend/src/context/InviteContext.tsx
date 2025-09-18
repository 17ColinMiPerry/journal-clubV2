import { createContext, useContext, useEffect, useCallback, useState } from "react";
import type { ReactNode } from "react";
import type { Group } from "../models/groups";
import { GroupModel } from "../models/groups";
import { useAuth } from "./AuthContext";

interface InviteContextType {
    invites: Group[];
    loading: boolean;
    error: Error | null;
    refreshInvites: () => Promise<void>;
    acceptInvite: (groupId: string) => Promise<void>;
    rejectInvite: (groupId: string) => Promise<void>;
}

interface InviteProviderProps {
    children: ReactNode;
}

const InviteContext = createContext<InviteContextType | undefined>(undefined);

export const useInvites = () => {
    const context = useContext(InviteContext);
    if (context === undefined) {
        throw new Error('useInvites must be used within a InviteProvider');
    }
    return context;
}

export const InviteProvider: React.FC<InviteProviderProps> = ({ children }) => {
    const [invites, setInvites] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { makeAuthenticatedRequest, currentUser } = useAuth();

    const refreshInvites = useCallback(async () => {
        if (!makeAuthenticatedRequest || !currentUser) {
            console.log('Skipping invites fetch - no auth or user:', { 
                hasAuth: !!makeAuthenticatedRequest, 
                userId: currentUser?.uid 
            });
            return;
        }

        try {
            console.log('Fetching invites for user:', currentUser.uid);
            setLoading(true);
            setError(null);
            const inviteIds = await GroupModel.getInvites(makeAuthenticatedRequest);
            const groups = await Promise.all(inviteIds.map(id => GroupModel.get(makeAuthenticatedRequest, id, true)));
            setInvites(groups);
        } catch (err) {
            console.error('Error fetching invites:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch invites'));
        } finally {
            setLoading(false);
        }
    }, [makeAuthenticatedRequest, currentUser]);

    const acceptInvite = useCallback(async (groupId: string) => {
        if (!makeAuthenticatedRequest || !currentUser) {
            console.error('Cannot accept invite - no auth or user');
            return;
        }

        try {
            await GroupModel.acceptInvite(makeAuthenticatedRequest, groupId);
            // Remove the accepted invite from the list immediately
            setInvites(prevInvites => prevInvites.filter(invite => invite.id !== groupId));
        } catch (err) {
            console.error('Error accepting invite:', err);
            setError(err instanceof Error ? err : new Error('Failed to accept invite'));
            // Refresh invites to ensure UI is in sync with server
            await refreshInvites();
        }
    }, [makeAuthenticatedRequest, currentUser, refreshInvites]);

    const rejectInvite = useCallback(async (groupId: string) => {
        if (!makeAuthenticatedRequest || !currentUser) {
            console.error('Cannot reject invite - no auth or user');
            return;
        }

        try {
            await GroupModel.rejectInvite(makeAuthenticatedRequest, groupId);
            // Remove the rejected invite from the list immediately
            setInvites(prevInvites => prevInvites.filter(invite => invite.id !== groupId));
        } catch (err) {
            console.error('Error rejecting invite:', err);
            setError(err instanceof Error ? err : new Error('Failed to reject invite'));
            // Refresh invites to ensure UI is in sync with server
            await refreshInvites();
        }
    }, [makeAuthenticatedRequest, currentUser, refreshInvites]);

    // Fetch invites when the provider mounts or auth state changes
    useEffect(() => {
        refreshInvites();
    }, [refreshInvites]);

    const value = {
        invites,
        loading,
        error,
        refreshInvites,
        acceptInvite,
        rejectInvite
    };

    return (
        <InviteContext.Provider value={value}>
            {children}
        </InviteContext.Provider>
    );
}