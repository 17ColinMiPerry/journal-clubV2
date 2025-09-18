const Post = {
    writable: ["title", "abstract", "links"],

    /**
     * Vote on a post (like/dislike)
     * @param {Object} db - Firestore database instance
     * @param {string} groupId - ID of the group
     * @param {string} postId - ID of the post
     * @param {string} userId - ID of the user voting
     * @param {string} voteType - Type of vote ('like' or 'dislike')
     * @param {boolean} remove - Whether to remove the vote instead of adding it
     * @returns {Object} {success, message, post} - Result of the operation
     */
    vote: async function (db, groupId, postId, userId, voteType, remove = false) {
        if (!groupId || !postId || !userId) {
            return { success: false, message: "Group ID, Post ID, and User ID are required", post: null };
        }

        if (!['like', 'dislike'].includes(voteType)) {
            return { success: false, message: "Invalid vote type", post: null };
        }

        try {
            const postRef = db.collection('groups').doc(groupId)
                .collection('posts').doc(postId);
            
            const doc = await postRef.get();
            if (!doc.exists) {
                return { success: false, message: "Post not found", post: null };
            }

            const postData = doc.data();
            const voters = postData.voters || [];
            const existingVote = voters.find(v => v.userId === userId);

            // Start a transaction to ensure vote counts stay consistent
            await db.runTransaction(async (transaction) => {
                // If removing vote
                if (remove) {
                    if (!existingVote || existingVote.type !== voteType) {
                        throw new Error("No matching vote to remove");
                    }
                    
                    // Remove vote and decrement counter
                    const newVoters = voters.filter(v => v.userId !== userId);
                    const update = {
                        voters: newVoters,
                        [voteType === 'like' ? 'upvotes' : 'downvotes']: postData[voteType === 'like' ? 'upvotes' : 'downvotes'] - 1,
                        updatedAt: new Date()
                    };
                    
                    transaction.update(postRef, update);
                } 
                // Adding/changing vote
                else {
                    let newVoters;
                    const updates = { updatedAt: new Date() };

                    if (existingVote) {
                        // If same vote type, do nothing
                        if (existingVote.type === voteType) {
                            throw new Error("Vote already exists");
                        }
                        
                        // Change vote type
                        newVoters = voters.map(v => 
                            v.userId === userId ? { userId, type: voteType } : v
                        );
                        
                        // Decrement old vote type, increment new vote type
                        updates[existingVote.type === 'like' ? 'upvotes' : 'downvotes'] = postData[existingVote.type === 'like' ? 'upvotes' : 'downvotes'] - 1;
                        updates[voteType === 'like' ? 'upvotes' : 'downvotes'] = postData[voteType === 'like' ? 'upvotes' : 'downvotes'] + 1;
                    } else {
                        // Add new vote
                        newVoters = [...voters, { userId, type: voteType }];
                        updates[voteType === 'like' ? 'upvotes' : 'downvotes'] = postData[voteType === 'like' ? 'upvotes' : 'downvotes'] + 1;
                    }
                    
                    updates.voters = newVoters;
                    transaction.update(postRef, updates);
                }
            });

            // Get updated post
            const updatedDoc = await postRef.get();
            const updatedPostData = updatedDoc.data();
            
            return {
                success: true,
                message: null,
                post: {
                    id: postId,
                    groupId, // Include the groupId in the response
                    ...updatedPostData,
                    createdAt: updatedPostData.createdAt.toDate().toISOString(),
                    updatedAt: updatedPostData.updatedAt.toDate().toISOString()
                }
            };
        } catch (error) {
            console.error('Post.vote error:', error.message);
            return { 
                success: false, 
                message: error.message || "Failed to update vote",
                post: null
            };
        }
    },

    /**
     * Create a new post in a group
     * @param {Object} db - Firestore database instance
     * @param {string} groupId - ID of the group this post belongs to
     * @param {Object} postData - Post data
     * @returns {Object} {post, message} - Created post or error message
     */
    create: async function (db, groupId, postData) {
        if (!groupId || !postData.title) {
            return { post: null, message: "Group ID and title are required" };
        }

        try {
            const postDoc = {
                title: postData.title,
                abstract: postData.abstract || "",
                links: postData.links || [],
                createdAt: new Date(),
                createdBy: postData.createdBy,
                updatedAt: new Date(),
                upvotes: 0,
                downvotes: 0,
                voters: [] // Array of user IDs who have voted
            };

            const docRef = await db.collection('groups').doc(groupId)
                .collection('posts').add(postDoc);
            
            return { 
                post: { 
                    id: docRef.id,
                    groupId,
                    ...postDoc 
                }, 
                message: null 
            };
        } catch (error) {
            console.error('Post.create error:', error.message);
            return { post: null, message: error.message };
        }
    },

    /**
     * Get a single post by ID
     * @param {Object} db - Firestore database instance
     * @param {string} groupId - ID of the group
     * @param {string} postId - ID of the post
     * @returns {Object|null} Post object or null if not found
     */
    findById: async function (db, groupId, postId) {
        if (!groupId || !postId) return null;

        try {
            const doc = await db.collection('groups').doc(groupId)
                .collection('posts').doc(postId).get();
            
            if (!doc.exists) return null;
            
            const postData = doc.data();
            return {
                id: doc.id,
                groupId,
                ...postData,
                createdAt: postData.createdAt.toDate().toISOString(),
                updatedAt: postData.updatedAt.toDate().toISOString()
            };
        } catch (error) {
            console.error('Post.findById error:', error.message);
            return null;
        }
    },

    /**
     * Get all posts for a group
     * @param {Object} db - Firestore database instance
     * @param {string} groupId - ID of the group
     * @returns {Array} Array of post objects
     */
    getByGroup: async function (db, groupId) {
        if (!groupId) return [];

        try {
            const snapshot = await db.collection('groups').doc(groupId)
                .collection('posts')
                .orderBy('createdAt', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                groupId,
                ...doc.data(),
                createdAt: doc.data().createdAt.toDate().toISOString(),
                updatedAt: doc.data().updatedAt.toDate().toISOString()
            }));
        } catch (error) {
            console.error('Post.getByGroup error:', error.message);
            return [];
        }
    },

    /**
     * Update a post
     * @param {Object} db - Firestore database instance
     * @param {string} groupId - ID of the group
     * @param {string} postId - ID of the post
     * @param {Object} data - Data to update
     * @returns {Object} {post, message} - Updated post or error message
     */
    update: async function (db, groupId, postId, data = {}) {
        if (!groupId || !postId) {
            return { post: null, message: "Group ID and Post ID are required" };
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
            
            await db.collection('groups').doc(groupId)
                .collection('posts').doc(postId)
                .update(validData);
            
            const updatedDoc = await db.collection('groups').doc(groupId)
                .collection('posts').doc(postId).get();

            const postData = updatedDoc.data();
            return { 
                post: { 
                    id: postId,
                    ...postData,
                    createdAt: postData.createdAt.toDate().toISOString(),
                    updatedAt: postData.updatedAt.toDate().toISOString()
                }, 
                message: null 
            };
        } catch (error) {
            console.error('Post.update error:', error.message);
            return { post: null, message: error.message };
        }
    },

    /**
     * Delete a post
     * @param {Object} db - Firestore database instance
     * @param {string} groupId - ID of the group
     * @param {string} postId - ID of the post
     * @returns {boolean} Success status
     */
    delete: async function (db, groupId, postId) {
        if (!groupId || !postId) return false;

        try {
            await db.collection('groups').doc(groupId)
                .collection('posts').doc(postId)
                .delete();
            return true;
        } catch (error) {
            console.error('Post.delete error:', error.message);
            return false;
        }
    }
};

export { Post };