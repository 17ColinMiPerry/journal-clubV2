import { useSavedPapersData } from "../../models/users"
import { Post } from "../../components/Post"
import type { Post as PostType } from "../../models/posts"

export default function SavedPaperPage() {
    const { papers, loading, error, refresh } = useSavedPapersData();

    return (
        <>
            <div className="mb-6">
                <h1 className="text-gray-100 text-xl font-semibold">Saved Papers</h1>
            </div>

            {error && (
                <div className="text-red-400 bg-red-900/50 p-4 rounded-lg border border-red-700 mb-6">
                    Error loading saved papers: {error.message}
                    <button 
                        onClick={refresh}
                        className="ml-4 text-red-200 hover:text-red-100 underline"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {loading ? (
                <div className="text-gray-400">Loading saved papers...</div>
            ) : papers.length === 0 ? (
                <div className="text-gray-400">No saved papers yet. Save some papers to see them here!</div>
            ) : (
                <div className="space-y-6">
                    {papers.map((paper: PostType) => (
                        <Post key={paper.id} post={paper} />
                    ))}
                </div>
            )}
        </>
    )
}