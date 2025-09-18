import { useState, useEffect, useCallback } from 'react';
import type { AuthenticatedRequest } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import type { Group } from './groups';
import { useGroups } from './groups';

export interface Vote {
    userId: string;
    type: 'like' | 'dislike';
}

export interface Post {
    id: string;
    title: string;
    abstract: string;
    links: string[];
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    upvotes: number;
    downvotes: number;
    voters: Vote[];
    groupId: string;
}

export interface CreatePostData {
    title: string;
    abstract?: string;
    links?: string[];
}

export interface UpdatePostData {
    title?: string;
    abstract?: string;
    links?: string[];
}

// Static methods for post operations
export const PostModel = {
    async create(makeAuthenticatedRequest: AuthenticatedRequest, groupId: string, data: CreatePostData): Promise<Post> {
        const response = await makeAuthenticatedRequest(`/api/groups/${groupId}/posts`, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to create post');
        }

        const result = await response.json();
        return result.data;
    },

    async getByGroup(makeAuthenticatedRequest: AuthenticatedRequest, groupId: string): Promise<Post[]> {
        const response = await makeAuthenticatedRequest(`/api/groups/${groupId}/posts`);

        if (!response.ok) {
            throw new Error('Failed to fetch posts');
        }

        const result = await response.json();
        return result.data;
    },

    async update(makeAuthenticatedRequest: AuthenticatedRequest, groupId: string, postId: string, data: UpdatePostData): Promise<Post> {
        const response = await makeAuthenticatedRequest(`/api/groups/${groupId}/posts/${postId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to update post');
        }

        const result = await response.json();
        return result.data;
    },

    async delete(makeAuthenticatedRequest: AuthenticatedRequest, groupId: string, postId: string): Promise<void> {
        const response = await makeAuthenticatedRequest(`/api/groups/${groupId}/posts/${postId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete post');
        }
    },

    /**
     * Vote on a post (like/dislike)
     * @param makeAuthenticatedRequest - Authenticated request function
     * @param groupId - ID of the group
     * @param postId - ID of the post
     * @param voteType - Type of vote ('like' or 'dislike')
     * @param remove - Whether to remove the vote instead of adding it
     * @returns Updated post data
     */
    async vote(
        makeAuthenticatedRequest: AuthenticatedRequest,
        groupId: string,
        postId: string,
        voteType: 'like' | 'dislike',
        remove: boolean = false
    ): Promise<Post> {
        const response = await makeAuthenticatedRequest(
            `/api/groups/${groupId}/posts/${postId}/vote?type=${voteType}&remove=${remove}`,
            { method: 'POST' }
        );

        if (!response.ok) {
            throw new Error('Failed to update vote');
        }

        const result = await response.json();
        return result.data;
    }
};

// Hook for managing posts list for a group
export function useGroupPosts(groupId: string) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const { makeAuthenticatedRequest, claimsSynced } = useAuth();

    const fetchPosts = useCallback(async () => {
        if (!makeAuthenticatedRequest || !claimsSynced || !groupId) return;
        
        try {
            setLoading(true);
            setError(null);
            const fetchedPosts = await PostModel.getByGroup(makeAuthenticatedRequest, groupId);
            // Sort posts by createdAt date, newest first
            setPosts(fetchedPosts.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ));
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch posts'));
        } finally {
            setLoading(false);
        }
    }, [makeAuthenticatedRequest, claimsSynced, groupId]);

    // Initial fetch
    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]); // Only depend on the memoized fetch function

    return { posts, loading, error, refresh: fetchPosts };
}

// Hook for managing all posts across groups
export function useAllPosts() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const { makeAuthenticatedRequest, claimsSynced } = useAuth();
    const { groups } = useGroups();

    const fetchAllPosts = useCallback(async () => {
        if (!makeAuthenticatedRequest || !claimsSynced || !groups?.length) return;
        
        try {
            setLoading(true);
            setError(null);

            // Fetch posts from all groups in parallel
            const allPostsPromises = groups.map((group: Group) => 
                PostModel.getByGroup(makeAuthenticatedRequest, group.id)
            );
            
            const allPostsArrays = await Promise.all(allPostsPromises);
            
            // Flatten and sort all posts by date, newest first
            const allPosts = allPostsArrays
                .flat()
                .sort((a: Post, b: Post) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

            setPosts(allPosts);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch posts'));
        } finally {
            setLoading(false);
        }
    }, [makeAuthenticatedRequest, claimsSynced, groups]);

    // Initial fetch
    useEffect(() => {
        fetchAllPosts();
    }, [fetchAllPosts]); // Only depend on the memoized fetch function

    return { posts, loading, error, refresh: fetchAllPosts };
}