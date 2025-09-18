import express from 'express';
import admin from 'firebase-admin';
import { User } from '../models/User.js';

export const authEndpoints = (apiRouter, authenticateToken) => {

// Get current user info with claims
apiRouter.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const { uid, email, role, permissions } = req.user;
    res.json({
      success: true,
      user: {
        uid,
        email,
        claims: { 
          role: role || null, 
          permissions: permissions || [] 
        }
      }
    });
  } catch (error) {
    console.error('Error in /auth/me:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to read auth state' 
    });
  }
});

// Sync custom claims from Firestore into Firebase token
// Call this ONCE after sign-in to add role/permissions to token
apiRouter.post('/auth/sync-claims', authenticateToken, async (req, res) => {
  try {
    // authenticateToken makes sure the user is authenticated
    const uid = req.user.uid;

    // Look up user's role in Firestore using User model
    let user = await User.get(req.db, uid);
    
    if (!user) {
      // Create default user record if it doesn't exist
      const { user: newUser, message } = await User.new(req.db, {
        uid: uid,
        email: req.user.email,
        displayName: req.user.name || null,
        photoURL: req.user.picture || null,
        createdBy: 'system'
      });
      
      if (message) {
        return res.status(500).json({
          success: false,
          error: `Failed to create user: ${message}`
        });
      }
      
      user = newUser;
    }
    
    const role = user.role;
    const permissions = user.permissions;

    // Set custom claims in Firebase token
    await admin.auth().setCustomUserClaims(uid, { role, permissions });

    res.json({ 
      success: true, 
      claims: { role, permissions },
      message: 'Claims synced! Client should refresh token with getIdToken(true)'
    });
  } catch (error) {
    console.error('Error syncing claims:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to sync claims' 
    });
  }
});

};
