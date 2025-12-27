import { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Home, Package, ShoppingCart, BarChart3, LogOut, User, Zap, ChevronDown, Plus, List, UserPlus, Users } from 'lucide-react';
import { APP_CONFIG } from '../constants/constants';

const Header = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const role = user?.role || 'Unknown';
    const username = user?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || user?.name || 'User';
    const [showInventoryDropdown, setShowInventoryDropdown] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => {
        // For root path, only match exactly
        if (path === '/') {
            return location.pathname === '/';
        }
        // For other paths, check if pathname starts with the path
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const NavButton = ({ path, icon: Icon, label }) => (
        <button
            onClick={() => navigate(path)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${isActive(path)
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
        >
            <Icon size={18} />
            <span>{label}</span>
        </button>
    );

    return (
        <header className="bg-white border-b-2 border-blue-200 shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-6 py-4">
                <div className="flex justify-between items-center">
                    {/* Logo & Brand */}
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-transform">
                                <Zap className="w-7 h-7 text-white" fill="currentColor" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {APP_CONFIG.APP_NAME}
                            </h1>
                            <p className="text-xs text-gray-600 font-medium tracking-wide">{APP_CONFIG.APP_SUBTITLE}</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden lg:flex items-center gap-2">
                        {role === 'Admin' && (
                            <NavButton path="/" icon={Home} label="Dashboard" />
                        )}

                        {role === 'Admin' && (
                            <>
                                {/* Inventory Dropdown */}
                                <div className="relative"
                                    onMouseEnter={() => setShowInventoryDropdown(true)}
                                    onMouseLeave={() => setShowInventoryDropdown(false)}
                                >
                                    <button
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${isActive('/inventory')
                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                                            }`}
                                    >
                                        <Package size={18} />
                                        <span>Inventory</span>
                                        <ChevronDown size={16} className={`transition-transform ${showInventoryDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showInventoryDropdown && (
                                        <div className="absolute top-full left-0 mt-0 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                                            <button
                                                onClick={() => {
                                                    navigate('/inventory/view');
                                                    setShowInventoryDropdown(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                            >
                                                <List size={18} />
                                                <span className="font-medium">View Inventory</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigate('/inventory/add');
                                                    setShowInventoryDropdown(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                            >
                                                <Plus size={18} />
                                                <span className="font-medium">Add Battery</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <NavButton path="/sales" icon={BarChart3} label="Sales Reports" />

                                {/* User Management Button (Admin only) */}
                                <NavButton path="/user-management" icon={Users} label="User Management" />
                            </>
                        )}

                        <NavButton path="/pos" icon={ShoppingCart} label="Point of Sale" />
                    </nav>

                    {/* User Info & Actions */}
                    <div className="flex items-center gap-4">
                        {/* User Dropdown */}
                        <div className="relative hidden md:block"
                            onMouseEnter={() => setShowUserDropdown(true)}
                            onMouseLeave={() => setShowUserDropdown(false)}
                        >
                            <button className="flex items-center gap-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 transition-colors cursor-pointer">
                                <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                                    {username.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-800 font-semibold text-sm leading-tight">{username}</p>
                                    <p className="text-xs text-blue-600 font-medium">{role}</p>
                                </div>
                                <ChevronDown size={16} className={`transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showUserDropdown && (
                                <div className="absolute right-0 top-full mt-0 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                                    <button
                                        onClick={() => {
                                            navigate('/change-password');
                                            setShowUserDropdown(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2"
                                    >
                                        <User size={18} />
                                        <span className="font-medium">Change Password</span>
                                    </button>
                                    <div className="border-t border-gray-100 my-1"></div>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setShowUserDropdown(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                    >
                                        <LogOut size={18} />
                                        <span className="font-medium">Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mobile Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="md:hidden flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all shadow-md font-medium"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <nav className="lg:hidden flex gap-2 mt-4 overflow-x-auto pb-2">
                    {role === 'Admin' && (
                        <NavButton path="/" icon={Home} label="Home" />
                    )}
                    {role === 'Admin' && (
                        <>
                            <NavButton path="/inventory/view" icon={Package} label="Inventory" />
                            <NavButton path="/sales" icon={BarChart3} label="Sales" />
                            <NavButton path="/users" icon={UserPlus} label="Users" />
                        </>
                    )}
                    <NavButton path="/pos" icon={ShoppingCart} label="POS" />
                </nav>
            </div>
        </header>
    );
};

export default Header;
