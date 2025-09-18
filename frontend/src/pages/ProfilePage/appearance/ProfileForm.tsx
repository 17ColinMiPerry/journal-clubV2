import { useState, useEffect } from "react"
import { useAuth } from "../../../context/AuthContext"
import { useUserProfile } from "../../../models/users"

export default function ProfileForm() {
    const { currentUser } = useAuth()
    const { profile, loading, error, updateProfile } = useUserProfile()
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({
        displayName: '',
        photoURL: ''
    })

    // Initialize form when profile loads
    useEffect(() => {
        if (profile) {
            setEditForm({
                displayName: profile.displayName || '',
                photoURL: profile.photoURL || ''
            });
        }
    }, [profile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProfile(editForm);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
        }
    };

    if (loading) {
        return <div className="text-gray-400">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-400">Error loading profile: {error.message}</div>;
    }

    if (!profile) {
        return <div className="text-gray-400">No profile found</div>;
    }

    return (
        <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center space-x-4 mb-6">
                <img
                    src={profile.photoURL || currentUser?.photoURL || ''}
                    alt={`${profile.displayName}'s avatar`}
                    className="w-20 h-20 rounded-full"
                    referrerPolicy="no-referrer"
                />
                <div>
                    <h2 className="text-xl font-semibold text-gray-100">
                        {profile.displayName || currentUser?.displayName}
                    </h2>
                    <p className="text-gray-400">{profile.email}</p>
                    <p className="text-gray-400 capitalize">{profile.role}</p>
                </div>
            </div>

            {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={editForm.displayName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Profile Picture URL
                        </label>
                        <input
                            type="text"
                            value={editForm.photoURL}
                            onChange={(e) => setEditForm(prev => ({ ...prev, photoURL: e.target.value }))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex space-x-3">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Save Changes
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Edit Profile
                </button>
            )}
        </div>
    )
}