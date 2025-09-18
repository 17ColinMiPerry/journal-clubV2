import { useState } from "react"
import { GroupModel } from "../../models/groups"
import { useAuth } from "../../context/AuthContext"
import { useGroups } from "../../context/GroupContext"
import { useNavigate } from "react-router-dom"
import { GearIcon } from "@phosphor-icons/react"

export default function GroupsPage() {
    const navigate = useNavigate()
    const { currentUser } = useAuth()
    const { groups, loading, error, refreshGroups: refresh } = useGroups()
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false)

    const handleCreateGroup = () => {
        setIsCreateGroupModalOpen(true)
    }

    const handleModalClose = () => {
        setIsCreateGroupModalOpen(false)
        refresh() // Refresh the groups list after modal closes
    }

    return (
        <>
            <div className="mb-6">
                <h1 className="text-gray-100 text-xl font-semibold">Your Groups</h1>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 mt-4" onClick={handleCreateGroup}>
                    Create Group
                </button>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
                {isCreateGroupModalOpen && <CreateGroupModal onClose={handleModalClose} />}
            
                {error ? (
                    <div className="text-red-400 bg-red-900/50 p-4 rounded-lg border border-red-700">
                        Error loading groups: {error.message}
                        <button 
                            onClick={refresh}
                            className="ml-4 text-red-200 hover:text-red-100 underline"
                        >
                            Try Again
                        </button>
                    </div>
                ) : loading ? (
                    <div className="text-gray-400">Loading groups...</div>
                ) : groups.length === 0 ? (
                    <div className="text-gray-400">No groups yet. Create your first group!</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groups.map(group => (
                            <div 
                                key={group.id} 
                                className="bg-gray-700 rounded-lg p-4 cursor-pointer transition-colors group hover:bg-gray-600 [&:has(.icon:hover)]:bg-gray-700"
                                onClick={() => {
                                    navigate('/groups/group', { state: { group } })
                                }}
                            >
                                <div className="flex flex-row items-center justify-between">
                                    <h3 className="text-gray-100 font-semibold text-xl">{group.name}</h3>
                                    {currentUser?.uid && group.admins.includes(currentUser.uid) && (
                                    <GearIcon 
                                        className="w-8 h-8 text-gray-400 hover:text-indigo-600 icon" 
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            navigate('/edit-group', { 
                                                state: { 
                                                    group,
                                                    from: '/groups'
                                                }
                                            })
                                        }}
                                    />
                                    )}
                                </div>
                                <p className="text-gray-400 text-sm mt-1 h-[5em] overflow-hidden">
                                    {group.description || "No description"}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}

function CreateGroupModal({ onClose }: { onClose: () => void }) {
    const { currentUser, makeAuthenticatedRequest } = useAuth()
    const { refreshGroups } = useGroups()
    const [formData, setFormData] = useState({
        name: "",
        description: ""
    })
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!currentUser) {
            setError("You must be logged in to create a group")
            return
        }

        if (!formData.name.trim()) {
            setError("Group name is required")
            return
        }

        try {
            setIsSubmitting(true)
            setError(null)
            
            console.log('Creating group:', { 
                name: formData.name.trim(),
                description: formData.description.trim(),
                userId: currentUser.uid 
            });

            await GroupModel.create(makeAuthenticatedRequest, {
                name: formData.name.trim(),
                description: formData.description.trim()
            })
            
            // Update groups in context
            refreshGroups()
            onClose()
        } catch (err) {
            console.error('Error creating group:', err);
            setError(err instanceof Error ? err.message : "Failed to create group")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 rounded-lg p-6 w-full max-w-xl shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-100">Create Group</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-300"
                    >
                        ✕
                    </button>
                </div>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Group Name</label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter group name"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                            placeholder="Describe your group (optional)"
                        />
                    </div>
                    <div className="flex justify-center items-center mt-8">
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className={`bg-indigo-600 text-xl text-white px-4 py-2 rounded-md hover:bg-indigo-700 w-1/2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Group'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    )
}