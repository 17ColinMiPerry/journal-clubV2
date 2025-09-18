import { Group } from '../models/Group.js';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';

export const requireGroupAdmin = () => {
    return async (req, res, next) => {
        try {
            const group = await Group.findById(req.db, req.params.groupId);
            if (!group) {
                return res.status(404).json({
                    success: false,
                    error: 'Group not found'
                });
            }

            // Check if user is an admin of the group
            if (!group.admins.includes(req.user.uid)) {
                return res.status(403).json({
                    success: false,
                    error: 'You must be an admin of this group to perform this action'
                });
            }

            next();
        } catch (error) {
            console.error('Error checking group admin status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to verify group admin status'
            });
        }
    };
};

export const requireGroupMembership = () => {
    return async (req, res, next) => {
        try {
            const group = await Group.findById(req.db, req.params.groupId);
            if (!group) {
                return res.status(404).json({
                    success: false,
                    error: 'Group not found'
                });
            }

            // Check if user is a member of the group
            if (!group.members.includes(req.user.uid)) {
                return res.status(403).json({
                    success: false,
                    error: 'You must be a member of this group to perform this action'
                });
            }

            next();
        } catch (error) {
            console.error('Error checking group membership:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to verify group membership'
            });
        }
    };
};

export const requirePostOwnership = () => {
    return async (req, res, next) => {
        try {
            const post = await Post.findById(req.db, req.params.groupId, req.params.postId);
            if (!post) {
                return res.status(404).json({
                    success: false,
                    error: 'Post not found'
                });
            }

            // Check if user owns the post
            if (post.createdBy !== req.user.uid) {
                return res.status(403).json({
                    success: false,
                    error: 'You must be the owner of this post to perform this action'
                });
            }

            next();
        } catch (error) {
            console.error('Error checking post ownership:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to verify post ownership'
            });
        }
    };
};

export const requireCommentOwnership = () => {
    return async (req, res, next) => {
        try {
            const commentDoc = await req.db.collection('groups').doc(req.params.groupId)
                .collection('posts').doc(req.params.postId)
                .collection('comments').doc(req.params.commentId)
                .get();

            if (!commentDoc.exists) {
                return res.status(404).json({
                    success: false,
                    error: 'Comment not found'
                });
            }

            const comment = commentDoc.data();

            // Check if user owns the comment
            if (comment.createdBy !== req.user.uid) {
                return res.status(403).json({
                    success: false,
                    error: 'You must be the owner of this comment to perform this action'
                });
            }

            next();
        } catch (error) {
            console.error('Error checking comment ownership:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to verify comment ownership'
            });
        }
    };
};