import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

interface AppShellProps {
    children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    const closeSidebar = () => {
        setIsSidebarOpen(false)
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-900">
            <Header toggleSidebar={toggleSidebar} />
            <div className="flex flex-1">
                <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto scrollbar-gray">
                    {children}
                </main>
            </div>
        </div>
    )
}
