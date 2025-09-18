const Comment = {
    writable: ["content"],

    /**
     * Create a new comment on a post
     * @param {Object} db - Firestore database instance
     * @param {string} groupId - ID of the group this post belongs to
     * @param {string} postId - ID of the post this comment belongs to
     * @param {Object} commentData - Comment data
     * @returns {Object} {comment, message} - Created comment or error message
     */
    create: async function (db, groupId, postId, commentData) {
        if (!groupId || !postId || !commentData.content || !commentData.createdBy) {
            return { comment: null, message: "Group ID, Post ID, content and createdBy are required" };
        }

        try {
            const commentDoc = {
                content: commentData.content,
                createdAt: new Date(),
                createdBy: commentData.createdBy,
                updatedAt: new Date(),
                isEdited: false,
                lastEditedAt: null
            };

            const docRef = await db.collection('groups').doc(groupId)
                .collection('posts').doc(postId)
                .collection('comments').add(commentDoc);
            
            return { 
                comment: { 
                    id: docRef.id,
                    groupId,
                    postId,
                    ...commentDoc,
                    createdAt: commentDoc.createdAt.toISOString(),
                    updatedAt: commentDoc.updatedAt.toISOString(),
                    lastEditedAt: commentDoc.lastEditedAt ? commentDoc.lastEditedAt.toISOString() : null
                }, 
                message: null 
            };
        } catch (error) {
            console.error('Comment.create error:', error.message);
            return { comment: null, message: error.message };
        }
    },

    /**
     * Get all comments for a post
     * @param {Object} db - Firestore database instance
     * @param {string} groupId - ID of the group
     * @param {string} postId - ID of the post
     * @returns {Array} Array of comment objects
     */
    getByPost: async function (db, groupId, postId) {
        if (!groupId || !postId) return [];

        try {
            const snapshot = await db.collection('groups').doc(groupId)
                .collection('posts').doc(postId)
                .collection('comments')
                .orderBy('createdAt', 'asc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                groupId,
                postId,
                ...doc.data(),
                createdAt: doc.data().createdAt.toDate().toISOString(),
                updatedAt: doc.data().updatedAt.toDate().toISOString(),
                lastEditedAt: doc.data().lastEditedAt ? doc.data().lastEditedAt.toDate().toISOString() : null
            }));
        } catch (error) {
            console.error('Comment.getByPost error:', error.message);
            return [];
        }
    },

    /**
     * Update a comment
     * @param {Object} db - Firestore database instance
     * @param {string} groupId - ID of the group
     * @param {string} postId - ID of the post
     * @param {string} commentId - ID of the comment
     * @param {Object} data - Data to update
     * @returns {Object} {comment, message} - Updated comment or error message
     */
    update: async function (db, groupId, postId, commentId, data = {}) {
        if (!groupId || !postId || !commentId) {
            return { comment: null, message: "Group ID, Post ID and Comment ID are required" };
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
            validData.isEdited = true;
            validData.lastEditedAt = new Date();
            
            await db.collection('groups').doc(groupId)
                .collection('posts').doc(postId)
                .collection('comments').doc(commentId)
                .update(validData);
            
            const updatedDoc = await db.collection('groups').doc(groupId)
                .collection('posts').doc(postId)
                .collection('comments').doc(commentId).get();

            const commentData = updatedDoc.data();
            return { 
                comment: { 
                    id: commentId,
                    groupId,
                    postId,
                    ...commentData,
                    createdAt: commentData.createdAt.toDate().toISOString(),
                    updatedAt: commentData.updatedAt.toDate().toISOString(),
                    lastEditedAt: commentData.lastEditedAt ? commentData.lastEditedAt.toDate().toISOString() : null
                }, 
                message: null 
            };
        } catch (error) {
            console.error('Comment.update error:', error.message);
            return { comment: null, message: error.message };
        }
    },

    /**
     * Delete a comment
     * @param {Object} db - Firestore database instance
     * @param {string} groupId - ID of the group
     * @param {string} postId - ID of the post
     * @param {string} commentId - ID of the comment
     * @returns {boolean} Success status
     */
    delete: async function (db, groupId, postId, commentId) {
        if (!groupId || !postId || !commentId) return false;

        try {
            await db.collection('groups').doc(groupId)
                .collection('posts').doc(postId)
                .collection('comments').doc(commentId)
                .delete();
            return true;
        } catch (error) {
            console.error('Comment.delete error:', error.message);
            return false;
        }
    }
};

export { Comment };
