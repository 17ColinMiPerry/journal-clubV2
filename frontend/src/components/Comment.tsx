import { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon } from '@phosphor-icons/react';
import type { Comment as CommentType } from '../models/comments';
import type { User } from '../models/users';
import { UserModel } from '../models/users';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface CommentProps {
    comment: CommentType;
    onEdit: (commentId: string, content: string) => Promise<void>;
    onDelete: (commentId: string) => Promise<void>;
}

export function Comment({ comment, onEdit, onDelete }: CommentProps) {
    const { makeAuthenticatedRequest, currentUser } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch comment creator's info
    useEffect(() => {
        if (makeAuthenticatedRequest) {
            UserModel.get(makeAuthenticatedRequest, comment.createdBy)
                .then(setUser)
                .catch(console.error);
        }
    }, [makeAuthenticatedRequest, comment.createdBy]);

    const handleEdit = async () => {
        try {
            await onEdit(comment.id, editContent);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating comment:', error);
        }
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await onDelete(comment.id);
        } catch (error) {
            console.error('Error deleting comment:', error);
            setIsDeleting(false);
        }
    };

    const isOwner = currentUser?.uid === comment.createdBy;

    return (
        <div className="py-4 border-b border-gray-700 last:border-b-0">
            <div className="flex items-start space-x-3">
                <img
                    className="h-8 w-8 rounded-full"
                    src={user?.photoURL || 'https://i.pravatar.cc/150?u=123'}
                    alt={`${user?.displayName || 'User'}'s avatar`}
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <span className="font-medium text-gray-200">
                                {user?.displayName || comment.createdBy}
                            </span>
                            <span className="text-gray-400 mx-2">•</span>
                            <span className="text-gray-400">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                            {comment.isEdited && (
                                <>
                                    <span className="text-gray-400 mx-2">•</span>
                                    <span className="text-gray-400 text-xs">
                                        edited {formatDistanceToNow(new Date(comment.lastEditedAt!), { addSuffix: true })}
                                    </span>
                                </>
                            )}
                        </div>
                        {isOwner && !isEditing && (
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-gray-400 hover:text-gray-300"
                                    title="Edit comment"
                                >
                                    <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="text-gray-400 hover:text-red-400"
                                    title="Delete comment"
                                    disabled={isDeleting}
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                    {isEditing ? (
                        <div className="mt-2">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:border-indigo-500"
                                rows={3}
                            />
                            <div className="mt-2 flex justify-end space-x-2">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditContent(comment.content);
                                    }}
                                    className="px-3 py-1 text-sm text-gray-300 hover:text-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEdit}
                                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="mt-1 text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
