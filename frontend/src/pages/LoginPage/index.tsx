import { GoogleLogoIcon } from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import { BookOpenIcon } from '@phosphor-icons/react'
import { useNavigate, useLocation } from 'react-router-dom';

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signInWithGoogle, loading } = useAuth();

    const handleSignIn = async () => {
        try {
            await signInWithGoogle();
            // Go back to where they came from, or home if they came directly to login
            const returnTo = location.state?.returnTo || '/';
            navigate(returnTo, { replace: true });
        } catch (error) {
            console.error('Failed to sign in:', error);
        }
    }

    return (
        <div>
            {loading ? (
                <div>loading</div>
            ) : (
                    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-gray-100 p-4">
                        <div className="w-full max-w-md">
                            <div className="text-center mb-10">
                                <div className="flex items-center justify-center">
                                    <BookOpenIcon className="h-12 w-12 text-indigo-400" />
                                    <h1 className="text-3xl font-bold ml-2 text-indigo-200">
                                        JournalClub
                                    </h1>
                                </div>
                                <p className="mt-3 text-gray-400 text-lg">
                                    Your academic reading companion
                                </p>
                            </div>
                            <div className="bg-gray-800 rounded-lg shadow-lg p-8">
                                <h2 className="text-2xl font-medium text-center mb-6">
                                    Welcome!
                                </h2>
                                <button
                                    className="flex items-center justify-center w-full bg-gray-700 hover:bg-gray-600 text-white rounded-md px-4 py-3 transition duration-300 ease-in-out"
                                    onClick={handleSignIn}
                                >
                                    <GoogleLogoIcon className="w-5 h-5 mr-2" weight="fill" />
                                    Continue with Google
                                </button>
                                <div className="mt-6 text-center text-sm text-gray-500">
                                    <p>Access your research articles, notes, and discussions</p>
                                </div>
                            </div>
                            <div className="mt-8 text-center text-sm text-gray-500">
                                <p>JournalClub © {new Date().getFullYear()}</p>
                            </div>
                        </div>
                    </div>
            )}
        </div>
    )
}