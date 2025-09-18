import admin from 'firebase-admin';
const FieldValue = admin.firestore.FieldValue;

const Group = {
    writable: ["name", "description", "photoURL"],

    /**
     * Create a new group
     * @param {Object} db - Firestore database instance
     * @param {Object} groupData - Group data
     * @returns {Object} {group, message} - Created group or error message
     */
    create: async function (db, groupData) {
        if (!groupData.name) {
            return { group: null, message: "Group name is required" };
        }

        try {
            console.log('Creating group with data:', groupData);
            const groupDoc = {
                name: groupData.name,
                description: groupData.description || "",
                photoURL: groupData.photoURL || null,
                members: [groupData.createdBy], // Array of user IDs
                admins: [groupData.createdBy],  // Array of user IDs with admin rights
                createdAt: new Date(),
                createdBy: groupData.createdBy,
                updatedAt: new Date()
            };

            console.log('Group document to be created:', groupDoc);
            const docRef = await db.collection('groups').add(groupDoc);
            
            // Verify the group was created correctly
            const createdDoc = await docRef.get();
            const createdData = createdDoc.data();
            console.log('Created group data:', { id: docRef.id, ...createdData });
            
            return { 
                group: { 
                    id: docRef.id, 
                    ...groupDoc,
                    createdAt: groupDoc.createdAt.toISOString(),
                    updatedAt: groupDoc.updatedAt.toISOString()
                }, 
                message: null 
            };
        } catch (error) {
            console.error('Group.create error:', error.message);
            return { group: null, message: error.message };
        }
    },

    /**
     * Get a single group by ID
     * @param {Object} db - Firestore database instance
     * @param {string} id - Group ID
     * @returns {Object|null} Group object or null if not found
     */
    findById: async function (db, id) {
        if (!id) return null;

        try {
            console.log('Finding group by ID:', id);
            const doc = await db.collection('groups').doc(id).get();
            if (!doc.exists) {
                console.log('Group not found:', id);
                return null;
            }
            
            const data = doc.data();
            const group = {
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate().toISOString(),
                updatedAt: data.updatedAt.toDate().toISOString()
            };
            console.log('Found group:', group);
            return group;
        } catch (error) {
            console.error('Group.findById error:', error.message);
            return null;
        }
    },

    /**
     * Get multiple groups with optional filtering
     * @param {Object} db - Firestore database instance
     * @param {Object} filters - Query filters
     * @returns {Array} Array of group objects
     */
    where: async function (db, filters = {}) {
        try {
            console.log('Querying groups with filters:', filters);
            let query = db.collection('groups');
            
            // Apply filters
            Object.entries(filters).forEach(([field, value]) => {
                if (field === 'members') {
                    // For members field, we want to find groups where the user is a member
                    console.log(`Adding array-contains filter: ${field} contains ${value}`);
                    query = query.where(field, 'array-contains', value);
                } else {
                    console.log(`Adding equality filter: ${field} = ${value}`);
                    query = query.where(field, '==', value);
                }
            });
            
            const snapshot = await query.get();
            const groups = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // format in a way the frontend can use
                    createdAt: data.createdAt.toDate().toISOString(),
                    updatedAt: data.updatedAt.toDate().toISOString()
                };
            });
            
            console.log('Found groups:', groups.length);
            console.log('Groups data:', groups.map(g => ({ 
                id: g.id, 
                name: g.name, 
                members: g.members,
                createdBy: g.createdBy 
            })));
            
            return groups;
        } catch (error) {
            console.error('Group.where error:', error.message);
            return [];
        }
    },

    /**
     * Update a group
     * @param {Object} db - Firestore database instance
     * @param {string} id - Group ID
     * @param {Object} data - Data to update
     * @returns {Object} {group, message} - Updated group or error message
     */
    update: async function (db, id, data = {}) {
        if (!id) {
            return { group: null, message: "Group ID is required for update" };
        }

        // Filter to only allow writable fields
        const validData = {};
        Object.entries(data).forEach(([key, value]) => {
            if (this.writable.includes(key)) {
                validData[key] = value;
            }
        });

        try {
            validData.updatedAt = new Date();
            await db.collection('groups').doc(id).update(validData);
            
            const updatedDoc = await db.collection('groups').doc(id).get();
            const groupData = updatedDoc.data();
            return { 
                group: { 
                    id, 
                    ...groupData,
                    createdAt: groupData.createdAt.toDate().toISOString(),
                    updatedAt: groupData.updatedAt.toDate().toISOString()
                }, 
                message: null 
            };
        } catch (error) {
            console.error('Group.update error:', error.message);
            return { group: null, message: error.message };
        }
    },

    /**
     * Add a member to a group
     * @param {Object} db - Firestore database instance
     * @param {string} groupId - Group ID
     * @param {string} userId - User ID to add
     * @returns {boolean} Success status
     */
    addMember: async function (db, groupId, userId) {
        try {
            await db.collection('groups').doc(groupId).update({
                members: FieldValue.arrayUnion(userId)
            });
            return true;
        } catch (error) {
            console.error('Group.addMember error:', error.message);
            return false;
        }
    },

    /**
     * Remove a member from a group
     * @param {Object} db - Firestore database instance
     * @param {string} groupId - Group ID
     * @param {string} userId - User ID to remove
     * @returns {boolean} Success status
     */
    removeMember: async function (db, groupId, userId) {
        try {
            await db.collection('groups').doc(groupId).update({
                members: FieldValue.arrayRemove(userId),
                admins: FieldValue.arrayRemove(userId)
            });
            return true;
        } catch (error) {
            console.error('Group.removeMember error:', error.message);
            return false;
        }
    },

    /**
     * Delete a group and all its subcollections (posts)
     * @param {Object} db - Firestore database instance
     * @param {string} id - Group ID
     * @returns {boolean} Success status
     */
    delete: async function (db, id) {
        try {
            const groupRef = db.collection('groups').doc(id);
            
            // Delete all posts in the posts subcollection
            const postsSnapshot = await groupRef.collection('posts').get();
            console.log(`Deleting ${postsSnapshot.size} posts from group ${id}`);
            
            // Delete posts in batches of 500 (Firestore batch limit)
            const batchSize = 500;
            const batches = [];
            let batch = db.batch();
            let operationCount = 0;

            for (const doc of postsSnapshot.docs) {
                batch.delete(doc.ref);
                operationCount++;

                if (operationCount === batchSize) {
                    batches.push(batch.commit());
                    batch = db.batch();
                    operationCount = 0;
                }
            }

            // Commit any remaining deletes
            if (operationCount > 0) {
                batches.push(batch.commit());
            }

            // Wait for all batches to complete
            await Promise.all(batches);
            console.log(`Successfully deleted all posts from group ${id}`);

            // Finally delete the group document itself
            await groupRef.delete();
            console.log(`Successfully deleted group ${id}`);
            
            return true;
        } catch (error) {
            console.error('Group.delete error:', error);
            return false;
        }
    }
};

export { Group };