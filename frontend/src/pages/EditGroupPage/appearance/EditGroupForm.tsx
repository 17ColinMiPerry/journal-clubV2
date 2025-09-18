import { useState, useEffect } from "react"
import { useAuth } from "../../../context/AuthContext"
import { useLocation } from "react-router-dom"
import type { Group } from "../../../models/groups"
import { GroupModel } from "../../../models/groups"
import { useNavigate } from "react-router-dom"
import { useGroups } from "../../../context/GroupContext"

export default function EditGroupForm() {
    const location = useLocation()
    const group = location.state.group as Group
    const { makeAuthenticatedRequest } = useAuth()
    const { updateGroup, removeGroup } = useGroups()
    const navigate = useNavigate()

    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        inviteUser: '',
    })
    
    useEffect(() => {
        if (group) {
            setEditForm({
                name: group.name || '',
                description: group.description || '',
                inviteUser: '',
            })
        }
    }, [group])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!group) return

        try {
            setIsSubmitting(true)
            setError(null)
            
            if (!editForm.name.trim()) {
                throw new Error('Group name is required')
            }

            await GroupModel.update(makeAuthenticatedRequest, group.id, {
                name: editForm.name.trim(),
                description: editForm.description.trim(),
            })


            // Update group in context
            const updatedGroup = { ...group, name: editForm.name.trim(), description: editForm.description.trim() }
            updateGroup(group.id, updatedGroup)
            
            // If we came from a specific group page, navigate back there
            if (location.state?.from === '/groups/group') {
                navigate('/groups/group', { state: { group: { ...group, ...editForm } } })
            } else {
                // Otherwise go back to the groups list
                navigate('/groups')
            }
        } catch (err) {
            console.error('Error updating group:', err)
            setError(err instanceof Error ? err.message : 'Failed to update group')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteGroup = async () => {
        if (!group) return
        await GroupModel.delete(makeAuthenticatedRequest, group.id)
        removeGroup(group.id)
        navigate('/groups')
    }

    const handleInviteUser = async () => {
        if (!group || !editForm.inviteUser.trim()) return
        
        try {
            const response = await makeAuthenticatedRequest(`/api/groups/${group.id}/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: editForm.inviteUser.trim()
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to invite user');
            }

            // Clear the invite input and show success in the error state (which can show success too)
            setEditForm(prev => ({ ...prev, inviteUser: '' }));
            setError('Invite sent successfully!');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setError(null);
            }, 3000);

        } catch (err) {
            console.error('Error inviting user:', err);
            setError(err instanceof Error ? err.message : 'Failed to invite user');
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-16 w-full">
                <div className="flex flex-col max-w-128">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Group Name
                    </label>
                    <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="flex flex-col max-w-full">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Group Description
                    </label>
                    <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[4.5rem] resize-y"
                        rows={3}
                        placeholder="Describe your group..."
                    />
                </div>
                <div className="flex flex-col max-w-128">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Invite User
                    </label>
                    <input
                        type="text"
                        value={editForm.inviteUser}
                        onChange={(e) => setEditForm(prev => ({ ...prev, inviteUser: e.target.value }))}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        type="button"
                        onClick={() => handleInviteUser()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Invite User
                    </button>
                </div>
                {error && (
                    <div className="text-red-400 bg-red-900/50 p-4 rounded-lg border border-red-700">
                        {error}
                    </div>
                )}
                <div className="flex flex-row justify-between items-center">
                    <div className="w-48">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                    <div className="w-48">
                        <button
                            type="button"
                            onClick={() => handleDeleteGroup()}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Delete Group
                        </button>
                    </div>
                </div>
            </div>
        </form>
    )
}