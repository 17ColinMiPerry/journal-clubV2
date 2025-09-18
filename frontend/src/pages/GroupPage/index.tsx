import { useState } from "react"
import { useLocation } from "react-router-dom"
import { Post } from "../../components/Post"
import type { Group } from "../../models/groups"
import AddPostModal from "../../components/AddPostModal"
import { GearIcon } from "@phosphor-icons/react"
import { useNavigate } from "react-router-dom"
import { usePosts } from "../../context/PostContext"
import { useAuth } from "../../context/AuthContext"

export default function GroupPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const group = location.state.group as Group
    const { currentUser } = useAuth()
    const { posts, loading } = usePosts()
    const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false)
    
    // Filter posts for this group
    const groupPosts = posts.filter(post => post.groupId === group.id)

    const handleModalClose = () => {
        setIsAddPostModalOpen(false)
    }

    return (
        <>
            <div className="mb-6">
                <div className="flex justify-between items-start w-full">
                    <div className="w-full">
                        <div className="flex flex-row items-start justify-between mb-8">
                            <h1 className="text-gray-100 text-xl font-semibold">{group.name}</h1>
                            {currentUser?.uid && group.admins.includes(currentUser.uid) && (
                            <GearIcon className="w-8 h-8 text-gray-400 hover:text-indigo-600 cursor-pointer" 
                            onClick={(e) => {
                                e.stopPropagation()
                                navigate("/edit-group", { 
                                    state: { 
                                        group,
                                        from: location.pathname 
                                    }
                                })
                            }}/>
                            )}
                        </div>
                        <p className="text-gray-400 text-sm mt-1">{group.description || "No description"}</p>
                    </div>
                </div>
            </div>

                {loading ? (
                    <div className="text-gray-400">Loading posts...</div>
                ) : groupPosts.length === 0 ? (
                    <div className="text-gray-400">No papers posted in this group yet.</div>
                ) : (
                    <div className="space-y-6">
                        {groupPosts.map((post) => (
                            <Post key={post.id} post={post} />
                        ))}
                    </div>
                )}
            {isAddPostModalOpen && (
                <AddPostModal 
                    onClose={handleModalClose}
                    groupId={group.id}
                />
            )}
        </>
    )
}