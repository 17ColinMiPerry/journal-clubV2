import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Post } from '../models/posts';
import { PostModel } from '../models/posts';
import { useAuth } from './AuthContext';
import { useGroups } from './GroupContext';

interface PostContextType {
    posts: Post[];
    loading: boolean;
    error: Error | null;
    refreshPosts: () => Promise<void>;
    addPost: (post: Post) => void;
    updatePost: (postId: string, updatedPost: Post) => void;
    removePost: (postId: string) => void;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const usePosts = () => {
    const context = useContext(PostContext);
    if (context === undefined) {
        throw new Error('usePosts must be used within a PostProvider');
    }
    return context;
};

interface PostProviderProps {
    children: ReactNode;
}

export const PostProvider: React.FC<PostProviderProps> = ({ children }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { makeAuthenticatedRequest, claimsSynced } = useAuth();
    const { groups } = useGroups();

    const refreshPosts = useCallback(async () => {
        if (!makeAuthenticatedRequest || !claimsSynced || !groups?.length) return;
        
        try {
            setLoading(true);
            setError(null);

            // Fetch posts from all groups in parallel
            const allPostsPromises = groups.map(async group => {
                const posts = await PostModel.getByGroup(makeAuthenticatedRequest, group.id);
                // Add groupId to each post
                return posts.map(post => ({ ...post, groupId: group.id }));
            });
            
            const allPostsArrays = await Promise.all(allPostsPromises);
            
            // Flatten and sort all posts by date, newest first
            const allPosts = allPostsArrays
                .flat()
                .sort((a: Post, b: Post) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

            setPosts(allPosts);
        } catch (err) {
            console.error('Error fetching posts:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch posts'));
            setPosts([]);
        } finally {
            setLoading(false);
        }
    }, [makeAuthenticatedRequest, groups]);

    // Add a new post to the list
    const addPost = useCallback((post: Post) => {
        setPosts(prev => [post, ...prev]); // Add to start since posts are sorted by date
    }, []);

    // Update an existing post
    const updatePost = useCallback((postId: string, updatedPost: Post) => {
        setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
    }, []);

    // Remove a post from the list
    const removePost = useCallback((postId: string) => {
        setPosts(prev => prev.filter(p => p.id !== postId));
    }, []);

    // Initial fetch
    React.useEffect(() => {
        refreshPosts();
    }, [refreshPosts]);

    const value = {
        posts,
        loading,
        error,
        refreshPosts,
        addPost,
        updatePost,
        removePost
    };

    return (
        <PostContext.Provider value={value}>
            {children}
        </PostContext.Provider>
    );
};
