// frontend/src/components/shared/Navbar.jsx
/**
 * Top navigation bar with user info and logout
 */
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            // Clear auth state first
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always redirect, even if logout fails
            localStorage.clear(); // Extra safety - clear everything
            window.location.replace('/login'); // Use replace instead of href for better behavior
        }
    };


    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center">
                        <h1 className="text-xl font-bold text-primary-600">
                            Workforce Scheduling Platform
                        </h1>
                    </div>

                    {/* User Info & Logout */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <User className="w-5 h-5 text-gray-500" />
                            <span className="font-medium text-gray-700">{user?.full_name || user?.email}</span>
                            <span className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-700 capitalize">
                                {user?.role}
                            </span>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
