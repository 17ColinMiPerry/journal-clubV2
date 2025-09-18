import { ListIcon, BookOpenIcon, MagnifyingGlassIcon, PlusIcon, SignOutIcon } from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import AddPostModal from '../AddPostModal'

interface UserProfile {
    displayName: string;
    photoURL: string;
}

function Header({ toggleSidebar }: { toggleSidebar: () => void }) {

    const { logout, currentUser, makeAuthenticatedRequest, claimsSynced } = useAuth()
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false)

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (currentUser && claimsSynced) {
                try {
                    const response = await makeAuthenticatedRequest('/api/users/me')
                    if (response.ok) {
                        const data = await response.json()
                        setUserProfile(data.data)
                    }
                } catch (error) {
                    console.error('Failed to fetch user profile:', error)
                }
            }
        }

        fetchUserProfile()
    }, [currentUser, makeAuthenticatedRequest, claimsSynced])

    const handleSignOut = () => {
        logout()
    }

    return (
        <header className="sticky top-0 z-[60] bg-gray-800 border-b border-gray-700 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        {/* Mobile menu button */}
                        <button
                            className="md:hidden mr-2 p-2 rounded-md text-gray-400 hover:text-white focus:outline-none"
                            onClick={toggleSidebar}
                        >
                            <ListIcon className="h-6 w-6" />
                        </button>
                        <div className="flex items-center flex-shrink-0">
                            <BookOpenIcon className="h-8 w-8 text-indigo-400" />
                            <span className="ml-2 text-xl font-bold text-indigo-200">
                                JournalClub
                            </span>
                        </div>
                        <div className="hidden md:block ml-10">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md bg-gray-700 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Search papers..."
                                    type="search"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={() => setIsAddPostModalOpen(true)} >
                            <PlusIcon className="h-5 w-5 mr-1" />
                            <span>Post Paper</span>
                        </button>
                        <div className="ml-4 flex items-center">
                            <div className="flex-shrink-0">
                                <img
                                    className="h-8 w-8 rounded-full"
                                    src={userProfile?.photoURL || currentUser?.photoURL || ''}
                                    alt={`${userProfile?.displayName || currentUser?.displayName}'s avatar`}
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                            <div className="hidden md:block ml-3">
                                <div className="text-sm font-medium text-gray-200">
                                    {userProfile?.displayName || currentUser?.displayName}
                                </div>
                            </div>
                            <button className="ml-3 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white" onClick={handleSignOut}>
                                <SignOutIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {isAddPostModalOpen && <AddPostModal onClose={() => setIsAddPostModalOpen(false)} />}
        </header>
    )
}

export default Header
