import { Post } from '../../components/Post'
import { usePosts } from '../../context/PostContext'

export default function MainFeedPage() {
    const { posts, loading } = usePosts()

    return (
        <>
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-100">Your Feed</h2>
                <p className="text-gray-400">Recent papers from your groups</p>
            </div>

                {loading ? (
                    <div className="text-gray-400">Loading posts...</div>
                ) : posts.length === 0 ? (
                    <div className="text-gray-400">No papers yet. Join some groups to see papers!</div>
                ) : (
                    <div className="space-y-6">
                        {posts.map((post) => (
                            <Post key={post.id} post={post} />
                        ))}
                    </div>
                )}
        </>
    )
}