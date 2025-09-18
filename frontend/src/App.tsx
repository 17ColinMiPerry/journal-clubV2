import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { GroupProvider } from './context/GroupContext'
import { PostProvider } from './context/PostContext'
import { UserProvider } from './context/UserContext'
import { InviteProvider } from './context/InviteContext'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './hocs/ProtectedRoute'
import MainFeedPage from './pages/MainFeedPage'
import ProfilePage from './pages/ProfilePage'
import AppShell from './components/AppShell/AppShell'
import GroupsPage from './pages/GroupsPage'
import GroupPage from './pages/GroupPage'
import EditGroupPage from './pages/EditGroupPage'
import InvitesPage from './pages/InvitesPage'
import SavedPaperPage from './pages/SavedPaperPage'
import PostPage from './pages/PostPage'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                    element={
                        <ProtectedRoute>
                            <UserProvider>
                                <GroupProvider>
                                    <PostProvider>
                                        <InviteProvider>
                                            <AppShell>
                                                <Outlet />
                                            </AppShell>
                                        </InviteProvider>
                                    </PostProvider>
                                </GroupProvider>
                            </UserProvider>
                        </ProtectedRoute>
                    }
                >
                    <Route path="/" element={<MainFeedPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/groups" element={<GroupsPage />} />
                    <Route path="/groups/group" element={<GroupPage />} />
                    <Route path="/edit-group" element={<EditGroupPage />} />
                    <Route path="/invites" element={<InvitesPage />} />
                    <Route path="/saved-papers" element={<SavedPaperPage />} />
                    <Route path="/post" element={<PostPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
