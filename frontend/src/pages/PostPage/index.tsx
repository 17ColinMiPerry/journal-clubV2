import { useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import { ThumbsUpIcon, ThumbsDownIcon } from '@phosphor-icons/react'
import type { Post as PostType } from "../../models/posts"
import type { User } from "../../models/users"
import { UserModel } from "../../models/users"
import { useAuth } from "../../context/AuthContext"
import { PostModel } from "../../models/posts"
import { usePosts } from "../../context/PostContext"
import { CommentList } from "../../components/CommentList"

export default function PostPage() {
    const location = useLocation()
    const { postId, groupId } = location.state
    const { makeAuthenticatedRequest, currentUser } = useAuth()
    const { updatePost } = usePosts()
    const [author, setAuthor] = useState<User | null>(null)
    const [isVoting, setIsVoting] = useState(false)
    const [post, setPost] = useState<PostType | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Get current user's vote on this post
    const userVote = currentUser && post?.voters.find(v => v.userId === currentUser.uid)?.type

    // Fetch post data
    const fetchPost = async () => {
        if (!makeAuthenticatedRequest) return;
        
        try {
            setError(null);
            const posts = await PostModel.getByGroup(makeAuthenticatedRequest, groupId);
            const foundPost = posts.find(p => p.id === postId);
            
            if (!foundPost) {
                throw new Error('Post not found');
            }
            
            setPost(foundPost);
            // Also update the post in the global context in case it's stale
            updatePost(foundPost.id, foundPost);
            
            // Also fetch author info
            const authorData = await UserModel.get(makeAuthenticatedRequest, foundPost.createdBy);
            setAuthor(authorData);
        } catch (err) {
            console.error('Error fetching post:', err);
            setError('Failed to load post');
        } finally {
            setIsLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [makeAuthenticatedRequest]);

    const handleVote = async (voteType: 'like' | 'dislike') => {
        if (!makeAuthenticatedRequest || !currentUser || !post || isVoting) return;
        
        try {
            setIsVoting(true);
            const shouldRemove = userVote === voteType;

            const updatedPost = await PostModel.vote(
                makeAuthenticatedRequest,
                groupId,
                postId,
                voteType,
                shouldRemove
            );
            setPost(updatedPost);
            // Update the post in the global context so it's reflected everywhere
            updatePost(updatedPost.id, updatedPost);
        } catch (error) {
            console.error('Error voting:', error);
            // Refresh post data on error
            await fetchPost();
        } finally {
            setIsVoting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <div className="text-gray-400">Loading post...</div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <div className="text-red-400">{error || 'Post not found'}</div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Post Header */}
            <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
                <div className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                        <img
                            src={author?.photoURL || 'https://i.pravatar.cc/150?u=123'}
                            alt={`${author?.displayName || 'User'}'s avatar`}
                            className="h-10 w-10 rounded-full"
                        />
                        <div>
                            <h2 className="text-gray-200 font-medium">
                                {author?.displayName || 'Loading...'}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                {new Date(post.createdAt).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <h1 className="text-2xl font-semibold text-gray-100 mb-4">
                        {post.title}
                    </h1>
                    
                    <p className="text-gray-300 text-lg mb-6">
                        {post.abstract}
                    </p>

                    {post.links && post.links.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {post.links.map((link) => {
                                let displayText = link;
                                let isValidUrl = false;
                                try {
                                    const url = new URL(link);
                                    displayText = url.hostname;
                                    isValidUrl = true;
                                } catch (e) {
                                    // Not a valid URL, will just display the raw link
                                }

                                return (
                                    <a
                                        key={isValidUrl ? new URL(link).href : link}
                                        href={isValidUrl ? link : `https://${link}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-indigo-200 hover:bg-gray-600"
                                    >
                                        {displayText}
                                    </a>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex items-center space-x-6 pt-4 border-t border-gray-700">
                        <button 
                            className={`flex items-center space-x-2 ${
                                userVote === 'like' 
                                    ? 'text-indigo-400 hover:text-indigo-300' 
                                    : 'text-gray-400 hover:text-gray-300'
                            }`}
                            onClick={() => handleVote('like')}
                            disabled={isVoting}
                        >
                            <ThumbsUpIcon 
                                className="h-5 w-5" 
                                weight={userVote === 'like' ? 'fill' : 'regular'}
                            />
                            <span>{post.upvotes}</span>
                        </button>
                        <button 
                            className={`flex items-center space-x-2 ${
                                userVote === 'dislike' 
                                    ? 'text-indigo-400 hover:text-indigo-300' 
                                    : 'text-gray-400 hover:text-gray-300'
                            }`}
                            onClick={() => handleVote('dislike')}
                            disabled={isVoting}
                        >
                            <ThumbsDownIcon 
                                className="h-5 w-5" 
                                weight={userVote === 'dislike' ? 'fill' : 'regular'}
                            />
                            <span>{post.downvotes}</span>
                        </button>
                    </div>

                </div>
            </div>

            {/* Comments Section */}
            <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <CommentList groupId={groupId} postId={postId} />
            </div>
        </div>
    )
}