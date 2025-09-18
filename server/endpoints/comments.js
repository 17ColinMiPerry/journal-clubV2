import { Comment } from '../models/Comment.js';
import { requireGroupMembership, requireCommentOwnership } from '../middleware/authorize.js';

export const commentEndpoints = (apiRouter, authenticateToken) => {
    // GET all comments for a post
    apiRouter.get('/groups/:groupId/posts/:postId/comments', authenticateToken, requireGroupMembership(), async (req, res) => {
        try {
            const comments = await Comment.getByPost(req.db, req.params.groupId, req.params.postId);
            res.json({
                success: true,
                data: comments
            });
        } catch (error) {
            console.error('Error fetching comments:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch comments'
            });
        }
    });

    // POST a new comment to a post
    apiRouter.post('/groups/:groupId/posts/:postId/comments', authenticateToken, requireGroupMembership(), async (req, res) => {
        try {
            const result = await Comment.create(req.db, req.params.groupId, req.params.postId, {
                ...req.body,
                createdBy: req.user.uid
            });

            if (!result.comment) {
                return res.status(400).json({
                    success: false,
                    error: result.message || 'Failed to create comment'
                });
            }

            res.status(201).json({
                success: true,
                data: result.comment
            });
        } catch (error) {
            console.error('Error creating comment:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create comment'
            });
        }
    });

    // PUT update a comment (only if user owns the comment)
    apiRouter.put('/groups/:groupId/posts/:postId/comments/:commentId', authenticateToken, requireGroupMembership(), requireCommentOwnership(), async (req, res) => {
        try {
            const result = await Comment.update(
                req.db,
                req.params.groupId,
                req.params.postId,
                req.params.commentId,
                req.body
            );

            if (!result.comment) {
                return res.status(400).json({
                    success: false,
                    error: result.message || 'Failed to update comment'
                });
            }

            res.json({
                success: true,
                data: result.comment
            });
        } catch (error) {
            console.error('Error updating comment:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update comment'
            });
        }
    });

    // DELETE a comment (only if user owns the comment)
    apiRouter.delete('/groups/:groupId/posts/:postId/comments/:commentId', authenticateToken, requireGroupMembership(), requireCommentOwnership(), async (req, res) => {
        try {
            const success = await Comment.delete(
                req.db,
                req.params.groupId,
                req.params.postId,
                req.params.commentId
            );

            if (!success) {
                return res.status(400).json({
                    success: false,
                    error: 'Failed to delete comment'
                });
            }

            res.json({
                success: true,
                message: 'Comment deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting comment:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete comment'
            });
        }
    });
};
