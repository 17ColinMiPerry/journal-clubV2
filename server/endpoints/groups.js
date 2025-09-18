import { requireGroupMembership, requireGroupAdmin } from '../middleware/authorize.js';
import { validateGroupCreate, validateGroupUpdate } from '../middleware/validate.js';
import { User } from '../models/User.js';
import { Group } from '../models/Group.js';
import admin from 'firebase-admin';

export const groupEndpoints = (apiRouter, authenticateToken) => {
    // GET all groups (only groups user is a member of)
    apiRouter.get('/groups', authenticateToken, async (req, res) => {
        try {
            console.log('Fetching groups for user:', req.user.uid);
            const groups = await Group.where(req.db, { members: req.user.uid });
            console.log('Found groups:', groups.length);
            console.log('Groups:', groups.map(g => ({ id: g.id, name: g.name, members: g.members })));
            
            res.json({
                success: true,
                data: groups
            });
        } catch (error) {
            console.error('Error fetching groups:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch groups'
            });
        }
    });

    // GET public group data by id (no membership check)
    apiRouter.get('/groups/:id/public', authenticateToken, async (req, res) => {
        try {
            console.log('Fetching public group data:', req.params.id);
            const group = await Group.findById(req.db, req.params.id);
            if (!group) {
                console.log('Group not found');
                return res.status(404).json({
                    success: false,
                    error: 'Group not found'
                });
            }
            
            // Return only public data
            const publicData = {
                id: group.id,
                name: group.name,
                description: group.description,
                members: group.members.length, // Only send the count
                createdAt: group.createdAt
            };
            
            res.json({
                success: true,
                data: publicData
            });
        } catch (error) {
            console.error('Error fetching public group data:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch group'
            });
        }
    });

    // GET a group by id (only if user is a member)
    apiRouter.get('/groups/:id', authenticateToken, requireGroupMembership(), async (req, res) => {
        try {
            console.log('Fetching group:', req.params.id, 'for user:', req.user.uid);
            console.log('Group found and user is member:', { id: req.group.id, name: req.group.name, members: req.group.members });
            res.json({
                success: true,
                data: req.group
            });
        } catch (error) {
            console.error('Error fetching group:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch group'
            });
        }
    });

    // POST a new group (already secure - user can only create for themselves)
    apiRouter.post('/groups', authenticateToken, validateGroupCreate, async (req, res) => {
        try {
            const { name, description } = req.body;
            const userId = req.user.uid;

            console.log('Creating group:', { name, description, userId });
            const result = await Group.create(req.db, {
                name,
                description,
                createdBy: userId
            });

            if (!result.group) {
                console.log('Failed to create group:', result.message);
                return res.status(400).json({
                    success: false,
                    error: result.message || 'Failed to create group'
                });
            }

            console.log('Group created successfully:', { 
                id: result.group.id, 
                name: result.group.name, 
                members: result.group.members,
                admins: result.group.admins 
            });

            res.status(201).json({
                success: true,
                data: result.group
            });
        } catch (error) {
            console.error('Error creating group:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create group'
            });
        }
    });

    // PUT update a group (only if user is a member)
    apiRouter.put('/groups/:id', authenticateToken, requireGroupAdmin(), validateGroupUpdate, async (req, res) => {
        try {
            const result = await Group.update(req.db, req.params.id, req.body);
            if (!result.group) {
                return res.status(400).json({
                    success: false,
                    error: result.message || 'Failed to update group'
                });
            }

            res.json({
                success: true,
                data: result.group
            });
        } catch (error) {
            console.error('Error updating group:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update group'
            });
        }
    });

    // DELETE a group (only if user is an admin)
    apiRouter.delete('/groups/:id', authenticateToken, requireGroupAdmin(), async (req, res) => {
        try {
            await Group.delete(req.db, req.params.id);
            
            res.json({
                success: true,
                message: 'Group deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting group:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete group'
            });
        }
    });

    // POST accept a group invite
    apiRouter.post('/groups/:id/accept-invite', authenticateToken, async (req, res) => {
        try {
            const groupId = req.params.id;
            const userId = req.user.uid;

            // Get user data to check if invite exists
            const user = await User.get(req.db, userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Check if user has an invite
            if (!user.pendingInvites?.includes(groupId)) {
                return res.status(400).json({
                    success: false,
                    error: 'No pending invite found for this group'
                });
            }

            // Get group to add user
            const group = await Group.findById(req.db, groupId);
            if (!group) {
                return res.status(404).json({
                    success: false,
                    error: 'Group not found'
                });
            }

            // Add user to group members and remove invite
            if (!group.members.includes(userId)) {
                try {
                    console.log('Adding user to group:', { userId, groupId });
                    
                    // Add to group members
                    const groupRef = req.db.collection('groups').doc(groupId);
                    await groupRef.update({ 
                        members: admin.firestore.FieldValue.arrayUnion(userId)
                    });
                    console.log('Successfully added user to group members');

                    // Remove from pending invites
                    const userRef = req.db.collection('users').doc(userId);
                    await userRef.update({ 
                        pendingInvites: admin.firestore.FieldValue.arrayRemove(groupId)
                    });
                    console.log('Successfully removed invite from user');
                } catch (updateError) {
                    console.error('Error updating group/user:', updateError);
                    throw updateError;
                }
            }

            res.json({
                success: true,
                message: 'Invite accepted successfully'
            });
        } catch (error) {
            console.error('Error accepting invite:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to accept invite'
            });
        }
    });

    // POST reject a group invite
    apiRouter.post('/groups/:id/reject-invite', authenticateToken, async (req, res) => {
        try {
            const groupId = req.params.id;
            const userId = req.user.uid;

            // Get user data to check if invite exists
            const user = await User.get(req.db, userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Check if user has an invite
            if (!user.pendingInvites?.includes(groupId)) {
                return res.status(400).json({
                    success: false,
                    error: 'No pending invite found for this group'
                });
            }

            // Remove invite from user's pending invites
            await req.db.runTransaction(async (transaction) => {
                const userRef = req.db.collection('users').doc(userId);
                const userDoc = await transaction.get(userRef);
                const updatedInvites = (userDoc.data().pendingInvites || []).filter(id => id !== groupId);
                transaction.update(userRef, { pendingInvites: updatedInvites });
            });

            res.json({
                success: true,
                message: 'Invite rejected successfully'
            });
        } catch (error) {
            console.error('Error rejecting invite:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to reject invite'
            });
        }
    });

    // POST invite a user to a group
    apiRouter.post('/groups/:id/invite', authenticateToken, requireGroupMembership(), async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: 'Email is required'
                });
            }

            // Find user by email
            const invitedUser = await User.getByEmail(req.db, email);
            if (!invitedUser) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Check if user is already a member
            if (req.group.members.includes(invitedUser.uid)) {
                return res.status(400).json({
                    success: false,
                    error: 'User is already a member of this group'
                });
            }

            // Add group invite
            const result = await User.addGroupInvite(req.db, invitedUser.uid, req.params.id);
            
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.message
                });
            }

            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            console.error('Error inviting user to group:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to invite user to group'
            });
        }
    });
}