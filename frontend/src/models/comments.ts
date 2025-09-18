import type { AuthenticatedRequest } from '../types/auth';

export interface Comment {
    id: string;
    groupId: string;
    postId: string;
    content: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    isEdited: boolean;
    lastEditedAt: string | null;
}

export const CommentModel = {
    /**
     * Get all comments for a post
     */
    getByPost: async (makeRequest: AuthenticatedRequest, groupId: string, postId: string): Promise<Comment[]> => {
        const response = await makeRequest(`/api/groups/${groupId}/posts/${postId}/comments`);
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch comments');
        }
        return data.data;
    },

    /**
     * Create a new comment
     */
    create: async (makeRequest: AuthenticatedRequest, groupId: string, postId: string, content: string): Promise<Comment> => {
        const response = await makeRequest(`/api/groups/${groupId}/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to create comment');
        }
        return data.data;
    },

    /**
     * Update a comment
     */
    update: async (makeRequest: AuthenticatedRequest, groupId: string, postId: string, commentId: string, content: string): Promise<Comment> => {
        const response = await makeRequest(`/api/groups/${groupId}/posts/${postId}/comments/${commentId}`, {
            method: 'PUT',
            body: JSON.stringify({ content })
        });
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to update comment');
        }
        return data.data;
    },

    /**
     * Delete a comment
     */
    delete: async (makeRequest: AuthenticatedRequest, groupId: string, postId: string, commentId: string): Promise<void> => {
        const response = await makeRequest(`/api/groups/${groupId}/posts/${postId}/comments/${commentId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to delete comment');
        }
    }
};
