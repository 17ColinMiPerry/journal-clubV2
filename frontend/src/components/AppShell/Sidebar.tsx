import { HouseIcon, UserIcon, BookmarkIcon, UsersIcon, EnvelopeIcon } from '@phosphor-icons/react'
import { Link, useLocation } from 'react-router-dom'
import { useGroups } from '../../context/GroupContext'





function Sidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const location = useLocation()
    const { groups, loading } = useGroups()

    return (
        <>
            {/* Mobile overlay */}
            <div
                className={`md:hidden fixed inset-0 bg-gray-900 z-20 transition-opacity duration-300 ${isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Sidebar */}
            <aside
                className={`
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0
          fixed md:sticky md:top-16 left-0 z-30
          w-64 bg-gray-800 border-r border-gray-700 
          h-[calc(100vh-64px)] 
          transition-transform duration-300 ease-in-out
        `}
            >
                <div className="p-4 h-full flex flex-col">
                    <nav className="space-y-1">
                        <Link
                            to="/"
                            onClick={onClose}
                            className={`flex items-center px-4 py-3 rounded-md group ${location.pathname === '/' ? 'text-gray-100 bg-gray-700' : 'text-gray-300 hover:bg-gray-700'}`}
                        >
                            <HouseIcon className="w-5 h-5 mr-3 text-gray-300 flex-shrink-0" />
                            <span className="truncate w-full">Home</span>
                        </Link>
                        <Link
                            to="/profile"
                            onClick={onClose}
                            className={`flex items-center px-4 py-3 rounded-md group ${location.pathname === '/profile' ? 'text-gray-100 bg-gray-700' : 'text-gray-300 hover:bg-gray-700'}`}
                        >
                            <UserIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-300 flex-shrink-0" />
                            <span className="truncate w-full">Profile</span>
                        </Link>
                        <Link
                            to="/saved-papers"
                            onClick={onClose}
                            className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-md group"
                        >
                            <BookmarkIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-300 flex-shrink-0" />
                            <span className="truncate w-full">Saved Papers</span>
                        </Link>
                        <Link
                            to="/groups"
                            onClick={onClose}
                            className={`flex items-center px-4 py-3 rounded-md group ${location.pathname === '/groups' ? 'text-gray-100 bg-gray-700' : 'text-gray-300 hover:bg-gray-700'}`}
                        >
                            <UsersIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-300 flex-shrink-0" />
                            <span className="truncate w-full">Groups</span>
                        </Link>
                        <Link
                            to="/invites"
                            onClick={onClose}
                            className={`flex items-center px-4 py-3 rounded-md group ${location.pathname === '/invites' ? 'text-gray-100 bg-gray-700' : 'text-gray-300 hover:bg-gray-700'}`}
                        >
                            <EnvelopeIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gray-300 flex-shrink-0" />
                            <span className="truncate w-full">Invites</span>
                        </Link>
                    </nav>

                    <div className="mt-8 flex-1 min-h-0 mb-6">
                        <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Your Groups
                        </h3>
                        <div className="mt-2 overflow-y-auto h-full pr-1 scrollbar-gray">
                            <nav className="space-y-1">
                                {loading ? (
                                    <div className="text-gray-400 text-sm px-4 py-2">Loading groups...</div>
                                ) : groups.length === 0 ? (
                                    <div className="text-gray-400 text-sm px-4 py-2">No groups yet</div>
                                ) : groups.map((group) => (
                                    <Link
                                        key={group.id}
                                        to="/groups/group"
                                        state={{ group }}
                                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-md group transition-colors"
                                        onClick={onClose}
                                    >
                                        <UsersIcon className="w-4 h-4 mr-3 text-gray-400 group-hover:text-gray-300 flex-shrink-0" />
                                        <span className="truncate w-full">{group.name}</span>
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>
            </aside>
        </>       
    )
}

export default Sidebar

