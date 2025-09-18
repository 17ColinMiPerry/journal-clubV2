import { useState, useEffect, useCallback } from 'react'
import { ThumbsUpIcon, ThumbsDownIcon, BookmarkIcon, ShareIcon } from '@phosphor-icons/react'
import { CommentList } from './CommentList'
import type { Post as PostType } from '../models/posts'
import { PostModel } from '../models/posts'
import type { User } from '../models/users'
import { useAuth } from '../context/AuthContext'
import { UserModel } from '../models/users'
import { useSavedPapers } from '../models/users'
import { useNavigate } from 'react-router-dom'
import { usePosts } from '../context/PostContext'

interface PostProps {
    post: PostType;
}

export function Post({ post }: PostProps) {
    const { makeAuthenticatedRequest, currentUser } = useAuth()
    const [user, setUser] = useState<User | null>(null)
    const [isSaved, setIsSaved] = useState(false)
    const [isVoting, setIsVoting] = useState(false)
    const [currentPost, setCurrentPost] = useState<PostType>(post)
    const { toggleSavedPaper, loading } = useSavedPapers()
    const navigate = useNavigate()
    const { updatePost } = usePosts()
    
    // Get current user's vote on this post
    const userVote = currentUser && currentPost.voters.find(v => v.userId === currentUser.uid)?.type

    const checkSavedStatus = useCallback(async () => {
        if (!currentUser || !makeAuthenticatedRequest) return;
        
        try {
            const userData = await UserModel.getCurrentUser(makeAuthenticatedRequest);
            const saved = userData.savedPapers?.includes(post.id) || false;
            console.log('Checking saved status:', { 
                postId: post.id, 
                savedPapers: userData.savedPapers,
                isSaved: saved 
            });
            setIsSaved(saved);
        } catch (error) {
            console.error('Error checking saved status:', error);
        }
    }, [currentUser, makeAuthenticatedRequest, post.id]);

    // Fetch post creator's info
    useEffect(() => {
        UserModel.get(makeAuthenticatedRequest, post.createdBy)
            .then(setUser)
            .catch(console.error)
    }, [makeAuthenticatedRequest, post.createdBy])

    // Check if paper is saved
    useEffect(() => {
        checkSavedStatus();
    }, [checkSavedStatus])

    // Update currentPost when post prop changes
    useEffect(() => {
        setCurrentPost(post);
    }, [post]);

    const handleToggleSave = async () => {
        try {
            console.log('Toggling save for post:', { id: post.id, post });
            await toggleSavedPaper(post.id);
            await checkSavedStatus(); // Refresh saved status after toggle
        } catch (error) {
            console.error('Error toggling saved status:', error);
        }
    }

    const handleVote = async (voteType: 'like' | 'dislike') => {
        if (!makeAuthenticatedRequest || !currentUser || isVoting) return;
        
        try {
            setIsVoting(true);
            // Get fresh vote status right before submitting
            const currentVote = currentPost.voters.find(v => v.userId === currentUser.uid)?.type;
            const shouldRemove = currentVote === voteType;

            const updatedPost = await PostModel.vote(
                makeAuthenticatedRequest,
                currentPost.groupId,
                currentPost.id,
                voteType,
                shouldRemove
            );
                setCurrentPost(updatedPost);
                // Update the post in the global context so it's reflected everywhere
                updatePost(updatedPost.id, updatedPost);
            } catch (error) {
                console.error('Error voting:', error);
                // Optionally refresh the post data on error to ensure UI is in sync
                if (makeAuthenticatedRequest) {
                    try {
                        const freshPost = await PostModel.getByGroup(makeAuthenticatedRequest, currentPost.groupId);
                        const updatedPost = freshPost.find(p => p.id === currentPost.id);
                        if (updatedPost) {
                            setCurrentPost(updatedPost);
                            // Also update the global context
                            updatePost(updatedPost.id, updatedPost);
                        }
                    } catch (refreshError) {
                        console.error('Error refreshing post data:', refreshError);
                    }
                }
            } finally {
            setIsVoting(false);
        }
    };

    return (
        <>
        <article className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:bg-gray-700 hover:cursor-pointer"
            onClick={() => {
                navigate(`/post`, { state: { postId: post.id, groupId: post.groupId } })
            }}>
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <img
                            className="h-8 w-8 rounded-full"
                            src={user?.photoURL || 'https://i.pravatar.cc/150?u=123'}
                            alt="User avatar"
                        />
                        <div className="ml-3">
                            <div className="text-sm font-medium text-gray-200">
                                {user?.displayName || post.createdBy}
                            </div>
                            <div className="flex items-center">
                                <span className="text-xs text-gray-400">
                                    {new Date(post.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-100 mb-2">
                    {post.title}
                </h3>
                <p className="text-gray-300 text-sm mb-3">{post.abstract}</p>
                {post.links && post.links.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {post.links.map((link) => {
                            // Try to parse the URL, if invalid just show the raw link
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
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-indigo-200 hover:bg-gray-600"
                                >
                                    {displayText}
                                </a>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="bg-gray-750 px-4 py-3 flex items-center justify-between border-t border-gray-700">
                <div className="flex items-center space-x-4">
                    <button 
                        className={`flex items-center hover:cursor-pointer ${
                            userVote === 'like' 
                                ? 'text-indigo-400 hover:text-indigo-300' 
                                : 'text-gray-400 hover:text-gray-300'
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleVote('like');
                        }}
                        disabled={isVoting}
                        title={userVote === 'like' ? 'Remove like' : 'Like'}
                    >
                        <ThumbsUpIcon 
                            className="h-4 w-4 mr-1" 
                            weight={userVote === 'like' ? 'fill' : 'regular'}
                        />
                        <span className="text-xs font-medium">{currentPost.upvotes}</span>
                    </button>
                    <button 
                        className={`flex items-center hover:cursor-pointer ${
                            userVote === 'dislike' 
                                ? 'text-indigo-400 hover:text-indigo-300' 
                                : 'text-gray-400 hover:text-gray-300'
                        }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleVote('dislike');
                        }}
                        disabled={isVoting}
                        title={userVote === 'dislike' ? 'Remove dislike' : 'Dislike'}
                    >
                        <ThumbsDownIcon 
                            className="h-4 w-4 mr-1" 
                            weight={userVote === 'dislike' ? 'fill' : 'regular'}
                        />
                        <span className="text-xs font-medium">{currentPost.downvotes}</span>
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                    <button 
                        className={`p-1 rounded-full ${
                            isSaved 
                                ? 'text-indigo-400 hover:text-indigo-300' 
                                : 'text-gray-400 hover:text-gray-300'
                        }`}
                        onClick={handleToggleSave}
                        disabled={loading}
                        title={isSaved ? "Remove from saved papers" : "Save paper"}
                    >
                        <BookmarkIcon 
                            className="h-4 w-4" 
                            weight={isSaved ? "fill" : "regular"}
                        />
                    </button>
                    <button className="p-1 rounded-full text-gray-400 hover:text-gray-300">
                        <ShareIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </article>
        {/* Only show comments on the full post page */}
        {window.location.pathname === '/post' && (
            <div className="mt-4">
                <CommentList groupId={post.groupId} postId={post.id} />
            </div>
        )}
        </>
    );
}