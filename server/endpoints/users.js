import { User } from '../models/User.js';

export const userEndpoints = (apiRouter, authenticateToken) => {
    // GET current user data (must come before :id route)
    apiRouter.get('/users/me', authenticateToken, async (req, res) => {
        try {
            const user = await User.get(req.db, req.user.uid);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Error fetching user:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch user data'
            });
        }
    });

    // GET saved papers (must come before :id route)
    apiRouter.get('/users/me/saved-papers', authenticateToken, async (req, res) => {
        try {
            const result = await User.getSavedPapers(req.db, req.user.uid);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.message || 'Failed to get saved papers'
                });
            }

            res.json({
                success: true,
                data: result.papers
            });
        } catch (error) {
            console.error('Error getting saved papers:', error);
            res.status(500).json({
                success: false, 
                error: 'Failed to get saved papers'
            });
        }
    });

    // GET user by ID
    apiRouter.get('/users/:id', authenticateToken, async (req, res) => {
        try {
            const user = await User.get(req.db, req.params.id);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Only return public user data
            const publicData = {
                uid: user.uid,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: user.role,
                createdAt: user.createdAt
            };

            res.json({
                success: true,
                data: publicData
            });
        } catch (error) {
            console.error('Error fetching user:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch user data'
            });
        }
    });

    // PUT update current user data
    apiRouter.put('/users/me', authenticateToken, async (req, res) => {
        try {
            const { displayName, photoURL } = req.body;
            
            const result = await User.update(req.db, req.user.uid, {
                displayName,
                photoURL
            });

            if (!result.user) {
                return res.status(400).json({
                    success: false,
                    error: result.message || 'Failed to update user'
                });
            }

            res.json({
                success: true,
                data: result.user
            });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update user data'
            });
        }
    });
    
    // POST toggle a paper in saved papers
    apiRouter.post('/users/me/saved-papers', authenticateToken, async (req, res) => {
        try {
            const { paperId } = req.body;
            
            if (!paperId) {
                return res.status(400).json({
                    success: false,
                    error: 'Paper ID is required'
                });
            }

            const result = await User.toggleSavedPaper(req.db, req.user.uid, paperId);
            
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.message || 'Failed to toggle saved paper'
                });
            }

            res.json({
                success: true,
                message: result.message,
                isSaved: result.isSaved
            });
        } catch (error) {
            console.error('Error toggling saved paper:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to toggle saved paper'
            });
        }
    });
};