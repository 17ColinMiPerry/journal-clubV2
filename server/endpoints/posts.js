import { Post } from '../models/Post.js';
import { Group } from '../models/Group.js';
import { requireGroupMembership, requirePostOwnership } from '../middleware/authorize.js';
import { validatePostCreate, validatePostUpdate } from '../middleware/validate.js';

export const postEndpoints = (apiRouter, authenticateToken) => {
    // GET all posts for a group (only if user is a member)
    apiRouter.get('/groups/:groupId/posts', authenticateToken, requireGroupMembership(), async (req, res) => {
        try {
            const posts = await Post.getByGroup(req.db, req.params.groupId);
            res.json({
                success: true,
                data: posts
            });
        } catch (error) {
            console.error('Error fetching posts:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch posts'
            });
        }
    });

    // POST a new post to a group (only if user is a member)
    apiRouter.post('/groups/:groupId/posts', authenticateToken, requireGroupMembership(), validatePostCreate, async (req, res) => {
        try {
            const result = await Post.create(req.db, req.params.groupId, {
                ...req.body,
                createdBy: req.user.uid
            });

            if (!result.post) {
                return res.status(400).json({
                    success: false,
                    error: result.message || 'Failed to create post'
                });
            }

            res.status(201).json({
                success: true,
                data: result.post
            });
        } catch (error) {
            console.error('Error creating post:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create post'
            });
        }
    });

    // PUT update a post (only if user owns the post or is admin)
    apiRouter.put('/groups/:groupId/posts/:postId', authenticateToken, requireGroupMembership(), requirePostOwnership(), validatePostUpdate, async (req, res) => {
        try {
            const result = await Post.update(req.db, req.params.groupId, req.params.postId, req.body);

            if (!result.post) {
                return res.status(400).json({
                    success: false,
                    error: result.message || 'Failed to update post'
                });
            }

            res.json({
                success: true,
                data: result.post
            });
        } catch (error) {
            console.error('Error updating post:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update post'
            });
        }
    });

    // DELETE a post (only if user owns the post or is admin)
    apiRouter.delete('/groups/:groupId/posts/:postId', authenticateToken, requireGroupMembership(), requirePostOwnership(), async (req, res) => {
        try {
            const success = await Post.delete(req.db, req.params.groupId, req.params.postId);

            if (!success) {
                return res.status(400).json({
                    success: false,
                    error: 'Failed to delete post'
                });
            }

            res.json({
                success: true,
                message: 'Post deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting post:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete post'
            });
        }
    });

    // POST vote on a post (like/dislike)
    apiRouter.post('/groups/:groupId/posts/:postId/vote', authenticateToken, requireGroupMembership(), async (req, res) => {
        const { type, remove } = req.query;
        
        // Validate vote type
        if (!type || !['like', 'dislike'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid vote type. Must be "like" or "dislike"'
            });
        }

        try {
            const result = await Post.vote(
                req.db,
                req.params.groupId,
                req.params.postId,
                req.user.uid,
                type,
                remove === 'true'
            );

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.message
                });
            }

            res.json({
                success: true,
                data: result.post
            });
        } catch (error) {
            console.error('Error voting on post:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update vote'
            });
        }
    });
};