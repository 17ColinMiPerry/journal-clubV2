import { lazy, Suspense } from 'react'

const ProfileForm = lazy(() => import('./appearance/ProfileForm'))

export default function ProfilePage() {
    return (
        <>
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-100">Your Profile</h2>
            </div>
            <div className="flex flex-col gap-4">
                <Suspense fallback={<div className="text-gray-400">Loading profile form...</div>}>
                    <ProfileForm />
                </Suspense>
            </div>
        </>
    )
}