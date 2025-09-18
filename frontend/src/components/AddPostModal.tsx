import { useState, useEffect } from "react"
import { useGroups } from "../models/groups"
import { PostModel } from "../models/posts"
import { useAuth } from "../context/AuthContext"
import { usePosts } from "../context/PostContext"

interface AddPostModalProps {
    onClose: () => void;
    groupId?: string; // Optional - if provided, group selection is skipped
}

export default function AddPostModal({ onClose, groupId }: AddPostModalProps) {
    const { groups, loading: groupsLoading } = useGroups()
    const { makeAuthenticatedRequest } = useAuth()
    const { addPost } = usePosts()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    const [formData, setFormData] = useState({
        groupId: groupId || "",
        title: "",
        abstract: "",
        links: ""
    })

    // Update groupId when groups load or when groupId prop changes
    useEffect(() => {
        if (groupId) {
            setFormData(prev => ({ ...prev, groupId }));
        } else if (groups.length > 0 && !formData.groupId) {
            setFormData(prev => ({ ...prev, groupId: groups[0].id }));
        }
    }, [groupId, groups]);
    
    const handlePost = async () => {
        // Validate inputs
        if (!formData.groupId) {
            setError("Please select a group")
            return
        }

        if (!formData.title.trim()) {
            setError("Title is required")
            return
        }

        try {
            setIsSubmitting(true)
            setError(null)

            // Convert links string to array and validate URLs
            const links = formData.links
                .split(",")
                .map(link => link.trim())
                .filter(link => link.length > 0)
                .map(link => {
                    // Try to parse as URL, if fails, prepend https://
                    try {
                        new URL(link);
                        return link;
                    } catch (e) {
                        return `https://${link}`;
                    }
                })

            console.log('Creating post:', {
                groupId: formData.groupId,
                title: formData.title.trim(),
                abstract: formData.abstract.trim(),
                links
            });

            const result = await PostModel.create(makeAuthenticatedRequest, formData.groupId, {
                title: formData.title.trim(),
                abstract: formData.abstract.trim(),
                links
            })

            // Add the new post to the context with groupId
            addPost({ ...result, groupId: formData.groupId })
            onClose()
        } catch (err) {
            console.error('Error creating post:', err);
            setError(err instanceof Error ? err.message : "Failed to create post")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Show loading state while groups are loading
    if (!groupId && groupsLoading) {
        return (
            <>
                <div 
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                    onClick={onClose}
                />
                <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-lg p-6 w-full max-w-3xl shadow-xl">
                    <div className="text-gray-400">Loading groups...</div>
                </div>
            </>
        )
    }

    // Show error state if no groups are available
    if (!groupId && !groupsLoading && groups.length === 0) {
        return (
            <>
                <div 
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                    onClick={onClose}
                />
                <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-lg p-6 w-full max-w-3xl shadow-xl">
                    <div className="text-red-400">You need to be a member of at least one group to post papers.</div>
                </div>
            </>
        )
    }

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-lg p-6 w-full max-w-3xl shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-100">Post Paper</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-300"
                    >
                        ✕
                    </button>
                </div>

                {!groupId && groups.length > 0 && (
                    <div className="mb-4">
                        <label htmlFor="group" className="block text-sm font-medium text-gray-300 mb-1">Group</label>
                        <select 
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={formData.groupId}
                            onChange={e => setFormData(prev => ({ ...prev, groupId: e.target.value }))}
                        >
                            <option value="">Select a group</option>
                            {groups.map((group) => (
                                <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={e => { e.preventDefault(); handlePost(); }}>
                    <div className="mb-4">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                        <input 
                            type="text" 
                            id="title" 
                            value={formData.title}
                            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                            placeholder="Enter paper title"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="abstract" className="block text-sm font-medium text-gray-300 mb-1">Abstract</label>
                        <textarea 
                            id="abstract" 
                            value={formData.abstract}
                            onChange={e => setFormData(prev => ({ ...prev, abstract: e.target.value }))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-48" 
                            placeholder="Enter paper abstract"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="links" className="block text-sm font-medium text-gray-300 mb-1">Links</label>
                        <input 
                            type="text" 
                            id="links" 
                            value={formData.links}
                            onChange={e => setFormData(prev => ({ ...prev, links: e.target.value }))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                            placeholder="Enter comma-separated links"
                        />
                        <p className="mt-1 text-sm text-gray-400">Separate multiple links with commas</p>
                    </div>
                </form>
                <div className="flex justify-center items-center mt-8">
                    <button 
                        className={`bg-indigo-600 text-xl text-white px-4 py-2 rounded-md hover:bg-indigo-700 w-1/2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handlePost}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </div>
        </>
    )
}