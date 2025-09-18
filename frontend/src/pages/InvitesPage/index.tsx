import { XIcon, CheckIcon } from '@phosphor-icons/react'
import { useGroups } from '../../context/GroupContext'
import { useInvites } from '../../context/InviteContext'

export default function InvitesPage() {
    const { invites, loading, error, acceptInvite, rejectInvite } = useInvites()
    const { refreshGroups } = useGroups()

    const handleAcceptInvite = async (groupId: string) => {
        await acceptInvite(groupId)
        // Refresh groups list to show the newly joined group
        refreshGroups()
    }

    const handleRejectInvite = async (groupId: string) => {
        await rejectInvite(groupId)
    }

    if (loading) {
        return (
            <div className="text-gray-400">Loading invites...</div>
        )
    }

    if (error) {
        return (
            <div className="text-red-400 bg-red-900/50 p-4 rounded-lg border border-red-700">
                {error.message}
            </div>
        )
    }

    if (invites.length === 0) {
        return (
            <div className="text-gray-400">No pending invites</div>
        )
    }

    return (
        <>
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-100">Your Invites</h2>
            </div>
            <div className="flex flex-col gap-6">
                {invites.map((group) => (
                    <div key={group.id} className="bg-gray-800 p-4 rounded-md text-gray-100 flex flex-row justify-between items-center">
                        <div className="flex flex-col gap-2">
                            <div className="text-2xl font-semibold">{group.name}</div>
                            <div className="text-gray-400">{group.description || "No description"}</div>
                            <div className="text-gray-400">{group.members.length} members</div>
                        </div>
                        <div className="flex flex-row gap-2">
                            <button 
                                className="bg-gray-800 p-4 rounded-md text-gray-100 hover:text-green-600 transition-colors"
                                onClick={() => handleAcceptInvite(group.id)}
                                aria-label="Accept invite"
                            >
                                <CheckIcon className="w-6 h-6" />
                            </button>
                            <button 
                                className="bg-gray-800 p-4 rounded-md text-gray-100 hover:text-red-600 transition-colors"
                                onClick={() => handleRejectInvite(group.id)}
                                aria-label="Reject invite"
                            >
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}