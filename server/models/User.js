const User = {
  defaultRole: "user",
  defaultPermissions: ["read"],
  writable: ["role", "permissions", "displayName", "photoURL", "pendingInvites", "savedPapers"],

  /**
   * Create a new user or update existing user data
   * @param {Object} db - Firestore database instance
   * @param {Object} userData - User data including uid, email, etc.
   * @returns {Object} {user, message} - Created user or error message
   */
  new: async function (db, userData) {
    if (!userData.uid || !userData.email) {
      return { user: null, message: "UID and email are required" };
    }

    try {
      const userDoc = {
        email: userData.email,
        role: userData.role || this.defaultRole,
        permissions: userData.permissions || this.defaultPermissions,
        displayName: userData.displayName || null,
        photoURL: userData.photoURL || null,
        pendingInvites: [],
        createdAt: new Date(),
        createdBy: userData.createdBy || 'system'
      };

      await db.collection('users').doc(userData.uid).set(userDoc);
      
      return { 
        user: { uid: userData.uid, ...userDoc }, 
        message: null 
      };
    } catch (error) {
      console.error('User.new error:', error.message);
      return { user: null, message: error.message };
    }
  },

  /**
   * Update an existing user with validation
   * @param {Object} db - Firestore database instance
   * @param {string} uid - User ID
   * @param {Object} data - Data to update
   * @returns {Object} {user, message} - Updated user or error message
   */
  update: async function (db, uid, data = {}) {
    if (!uid) {
      return { user: null, message: "User ID is required for update" };
    }

    // Filter to only allow writable fields
    const validData = {};
    Object.entries(data).forEach(([key, value]) => {
      if (this.writable.includes(key)) {
        validData[key] = value;
      }
    });

    if (Object.keys(validData).length === 0) {
      return { user: null, message: "No valid fields to update" };
    }

    try {
      // Add update timestamp
      validData.updatedAt = new Date();
      
      await db.collection('users').doc(uid).update(validData);
      
      // Return updated user
      const updatedDoc = await db.collection('users').doc(uid).get();
      if (!updatedDoc.exists) {
        return { user: null, message: "User not found after update" };
      }

      return { 
        user: { uid, ...updatedDoc.data() }, 
        message: null 
      };
    } catch (error) {
      console.error('User.update error:', error.message);
      return { user: null, message: error.message };
    }
  },

  /**
   * Get a single user by UID
   * @param {Object} db - Firestore database instance
   * @param {string} uid - User ID
   * @returns {Object|null} User object or null if not found
   */
  get: async function (db, uid) {
    if (!uid) return null;

    try {
      const doc = await db.collection('users').doc(uid).get();
      return doc.exists ? { uid, ...doc.data() } : null;
    } catch (error) {
      console.error('User.get error:', error.message);
      return null;
    }
  },

  /**
   * Get multiple users with optional filtering and pagination
   * @param {Object} db - Firestore database instance
   * @param {Object} filters - Query filters (e.g., {role: 'admin'})
   * @param {number|null} limit - Maximum number of results
   * @param {string|null} orderBy - Field to order by
   * @returns {Array} Array of user objects
   */
  where: async function (db, filters = {}, limit = null, orderBy = null) {
    try {
      let query = db.collection('users');
      
      // Apply filters
      Object.entries(filters).forEach(([field, value]) => {
        query = query.where(field, '==', value);
      });
      
      // Apply ordering
      if (orderBy) {
        query = query.orderBy(orderBy);
      }
      
      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('User.where error:', error.message);
      return [];
    }
  },

  /**
   * Delete a user
   * @param {Object} db - Firestore database instance
   * @param {string} uid - User ID
   * @returns {boolean} Success status
   */
  delete: async function (db, uid) {
    if (!uid) return false;

    try {
      await db.collection('users').doc(uid).delete();
      return true;
    } catch (error) {
      console.error('User.delete error:', error.message);
      return false;
    }
  },

  /**
   * Get user count with optional filters
   * @param {Object} db - Firestore database instance
   * @param {Object} filters - Query filters
   * @returns {number} Count of matching users
   */
  count: async function (db, filters = {}) {
    try {
      let query = db.collection('users');
      
      Object.entries(filters).forEach(([field, value]) => {
        query = query.where(field, '==', value);
      });
      
      const snapshot = await query.get();
      return snapshot.size;
    } catch (error) {
      console.error('User.count error:', error.message);
      return 0;
    }
  },

  /**
   * Business logic: Check if user can perform role-based action
   * @param {Object} currentUser - User performing the action
   * @param {string} requiredRole - Role required for the action
   * @returns {boolean} Whether user can perform action
   */
  canPerformAction: function (currentUser, requiredRole) {
    const roleHierarchy = {
      'user': 1,
      'moderator': 2,
      'admin': 3,
      'superadmin': 4
    };

    const userLevel = roleHierarchy[currentUser.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  },

  /**
   * Business logic: Check if user has specific permission
   * @param {Object} user - User to check
   * @param {string} permission - Permission to check for
   * @returns {boolean} Whether user has permission
   */
  hasPermission: function (user, permission) {
    return user.permissions && user.permissions.includes(permission);
  },

  /**
   * Business logic: Get default permissions for a role
   * @param {string} role - Role to get permissions for
   * @returns {Array} Array of permissions
   */
  getDefaultPermissionsForRole: function (role) {
    const rolePermissions = {
      'user': ['read'],
      'moderator': ['read', 'write'],
      'admin': ['read', 'write', 'delete'],
      'superadmin': ['read', 'write', 'delete', 'manage']
    };

    return rolePermissions[role] || this.defaultPermissions;
  },

  /**
   * Add a group invite for a user
   * @param {Object} db - Firestore database instance
   * @param {string} userId - User ID to invite
   * @param {string} groupId - Group ID to invite to
   * @returns {Object} {success, message} - Operation result
   */
  addGroupInvite: async function (db, userId, groupId) {
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return { success: false, message: "User not found" };
      }

      const userData = userDoc.data();
      const pendingInvites = userData.pendingInvites || [];

      // Check if invite already exists
      if (!pendingInvites.includes(groupId)) {
        pendingInvites.push(groupId);
        await userRef.update({ pendingInvites });
        return { success: true, message: "Invite sent successfully" };
      }

      return { success: true, message: "User already invited to this group" };
    } catch (error) {
      console.error('User.addGroupInvite error:', error.message);
      return { success: false, message: error.message };
    }
  },

  /**
   * Remove a group invite for a user
   * @param {Object} db - Firestore database instance
   * @param {string} userId - User ID
   * @param {string} groupId - Group ID to remove invite for
   * @returns {Object} {success, message} - Operation result
   */
  removeGroupInvite: async function (db, userId, groupId) {
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return { success: false, message: "User not found" };
      }

      const userData = userDoc.data();
      const pendingInvites = userData.pendingInvites || [];
      const updatedInvites = pendingInvites.filter(id => id !== groupId);

      await userRef.update({ pendingInvites: updatedInvites });
      return { success: true, message: "Invite removed successfully" };
    } catch (error) {
      console.error('User.removeGroupInvite error:', error.message);
      return { success: false, message: error.message };
    }
  },

  /**
   * Get user by email
   * @param {Object} db - Firestore database instance
   * @param {string} email - User email
   * @returns {Object|null} User object or null if not found
   */
  getByEmail: async function (db, email) {
    if (!email) return null;

    try {
      const snapshot = await db.collection('users')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get();

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return { uid: doc.id, ...doc.data() };
    } catch (error) {
      console.error('User.getByEmail error:', error.message);
      return null;
    }
  },

  /**
   * Toggle a paper in user's saved papers (add if not saved, remove if already saved)
   * @param {Object} db - Firestore database instance
   * @param {string} userId - User ID
   * @param {string} paperId - Paper ID to toggle
   * @returns {Object} {success, message, isSaved} - Operation result and current state
   */
  /**
   * Get all saved papers for a user with full paper details
   * @param {Object} db - Firestore database instance
   * @param {string} userId - User ID
   * @returns {Object} {success, papers, message} - Operation result with papers array
   */
  getSavedPapers: async function (db, userId) {
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return { success: false, message: "User not found" };
      }

      const userData = userDoc.data();
      const savedPaperIds = userData.savedPapers || [];

      // If no saved papers, return empty array
      if (savedPaperIds.length === 0) {
        return { success: true, papers: [] };
      }

      // Get all saved papers in parallel
      const paperPromises = savedPaperIds.map(async (paperId) => {
        // Try main feed first since it's simpler
        const mainFeedDoc = await db.collection('posts').doc(paperId).get();
        if (mainFeedDoc.exists) {
          return { id: mainFeedDoc.id, ...mainFeedDoc.data() };
        }

        // If not found in main feed, try groups
        const groups = await db.collection('groups').get();
        for (const group of groups.docs) {
          const postDoc = await group.ref.collection('posts').doc(paperId).get();
          if (postDoc.exists) {
            return {
              id: postDoc.id,
              ...postDoc.data(),
              groupId: group.id
            };
          }
        }

        // If paper not found anywhere, return null
        return null;
      });

      const papers = (await Promise.all(paperPromises))
        .filter(paper => paper !== null); // Remove any papers that weren't found

      return { 
        success: true, 
        papers,
        message: "Successfully retrieved saved papers"
      };
    } catch (error) {
      console.error('User.getSavedPapers error:', error.message);
      return { success: false, message: error.message };
    }
  },

  toggleSavedPaper: async function (db, userId, paperId) {
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return { success: false, message: "User not found" };
      }

      const userData = userDoc.data();
      const savedPapers = userData.savedPapers || [];
      const isCurrentlySaved = savedPapers.includes(paperId);

      let updatedPapers;
      let message;
      
      if (isCurrentlySaved) {
        // Remove the paper
        updatedPapers = savedPapers.filter(id => id !== paperId);
        message = "Paper removed from saved papers";
      } else {
        // Add the paper
        updatedPapers = [...savedPapers, paperId];
        message = "Paper added to saved papers";
      }

      await userRef.update({ savedPapers: updatedPapers });
      return { 
        success: true, 
        message, 
        isSaved: !isCurrentlySaved 
      };
    } catch (error) {
      console.error('User.toggleSavedPaper error:', error.message);
      return { success: false, message: error.message };
    }
  }
};

export { User };
