import { useState, useEffect } from 'react';
import { Comment as CommentComponent } from './Comment';
import type { Comment } from '../models/comments';
import { CommentModel } from '../models/comments';
import { useAuth } from '../context/AuthContext';

interface CommentListProps {
    groupId: string;
    postId: string;
}

export function CommentList({ groupId, postId }: CommentListProps) {
    const { makeAuthenticatedRequest, currentUser } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch comments
    useEffect(() => {
        if (makeAuthenticatedRequest) {
            CommentModel.getByPost(makeAuthenticatedRequest, groupId, postId)
                .then(setComments)
                .catch(console.error)
                .finally(() => setIsLoading(false));
        }
    }, [makeAuthenticatedRequest, groupId, postId]);

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!makeAuthenticatedRequest || !newComment.trim()) return;

        try {
            setIsSubmitting(true);
            const comment = await CommentModel.create(
                makeAuthenticatedRequest,
                groupId,
                postId,
                newComment.trim()
            );
            setComments(prev => [...prev, comment]);
            setNewComment('');
        } catch (error) {
            console.error('Error creating comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditComment = async (commentId: string, content: string) => {
        if (!makeAuthenticatedRequest) return;

        try {
            const updatedComment = await CommentModel.update(
                makeAuthenticatedRequest,
                groupId,
                postId,
                commentId,
                content
            );
            setComments(prev => 
                prev.map(comment => 
                    comment.id === commentId ? updatedComment : comment
                )
            );
        } catch (error) {
            console.error('Error updating comment:', error);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!makeAuthenticatedRequest) return;

        try {
            await CommentModel.delete(
                makeAuthenticatedRequest,
                groupId,
                postId,
                commentId
            );
            setComments(prev => prev.filter(comment => comment.id !== commentId));
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="animate-pulse">
                <div className="h-20 bg-gray-700 rounded-md mb-4"></div>
                <div className="h-20 bg-gray-700 rounded-md"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 m-6">
            <div className="bg-gray-800 rounded-lg p-4">
                <form onSubmit={handleSubmitComment}>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:border-indigo-500"
                        rows={3}
                    />
                    <div className="mt-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={!newComment.trim() || isSubmitting}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Posting...' : 'Post Comment'}
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="bg-gray-800 rounded-lg divide-y divide-gray-700">
                {comments.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">
                        No comments yet. Be the first to comment!
                    </div>
                ) : (
                    comments.map(comment => (
                        <CommentComponent
                            key={comment.id}
                            comment={comment}
                            onEdit={handleEditComment}
                            onDelete={handleDeleteComment}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
