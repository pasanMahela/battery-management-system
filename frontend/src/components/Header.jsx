import { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Home, Package, ShoppingCart, BarChart3, LogOut, User, Zap, ChevronDown, Plus, List, Users, History, Menu, X } from 'lucide-react';
import { APP_CONFIG } from '../constants/constants';

const Header = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const role = user?.role || 'Unknown';
    const username = user?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || user?.name || 'User';
    const [showInventoryDropdown, setShowInventoryDropdown] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const handleNavigation = (path) => {
        navigate(path);
        setShowMobileMenu(false);
        setShowInventoryDropdown(false);
    };

    // Desktop Nav Button
    const NavButton = ({ path, icon: Icon, label, className = '' }) => (
        <button
            onClick={() => handleNavigation(path)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all text-sm whitespace-nowrap ${isActive(path)
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                } ${className}`}
        >
            <Icon size={16} />
            <span className="hidden xl:inline">{label}</span>
        </button>
    );

    // Mobile Nav Item
    const MobileNavItem = ({ path, icon: Icon, label }) => (
        <button
            onClick={() => handleNavigation(path)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium transition-all ${isActive(path)
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                : 'text-gray-700 hover:bg-blue-50'
                }`}
        >
            <Icon size={20} />
            <span>{label}</span>
        </button>
    );

    return (
        <header className="bg-white border-b-2 border-blue-200 shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
                <div className="flex justify-between items-center">
                    {/* Logo & Brand */}
                    <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="relative">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <Zap className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" fill="currentColor" />
                            </div>
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                                {APP_CONFIG.APP_NAME}
                            </h1>
                            <p className="text-[10px] lg:text-xs text-gray-500 font-medium hidden lg:block">{APP_CONFIG.APP_SUBTITLE}</p>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1 lg:gap-2">
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
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all text-sm ${isActive('/inventory') || isActive('/return-history')
                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                                            }`}
                                    >
                                        <Package size={16} />
                                        <span className="hidden xl:inline">Inventory</span>
                                        <ChevronDown size={14} className={`transition-transform ${showInventoryDropdown ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showInventoryDropdown && (
                                        <div className="absolute top-full left-0 mt-0 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                                            <button
                                                onClick={() => handleNavigation('/inventory/view')}
                                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 transition-colors text-left text-sm"
                                            >
                                                <List size={16} />
                                                <span className="font-medium">View Inventory</span>
                                            </button>
                                            <button
                                                onClick={() => handleNavigation('/inventory/add')}
                                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 transition-colors text-left text-sm"
                                            >
                                                <Plus size={16} />
                                                <span className="font-medium">Add Battery</span>
                                            </button>
                                            <div className="border-t border-gray-100 my-1"></div>
                                            <button
                                                onClick={() => handleNavigation('/return-history')}
                                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-orange-50 transition-colors text-left text-sm"
                                            >
                                                <History size={16} className="text-orange-600" />
                                                <span className="font-medium text-orange-600">Return History</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <NavButton path="/sales" icon={BarChart3} label="Sales" />
                                <NavButton path="/customers" icon={Users} label="Customers" />
                                <NavButton path="/users" icon={Users} label="Users" />
                            </>
                        )}

                        <NavButton path="/pos" icon={ShoppingCart} label="POS" />
                    </nav>

                    {/* Right Side - User & Mobile Menu */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* User Dropdown - Desktop */}
                        <div className="relative hidden md:block"
                            onMouseEnter={() => setShowUserDropdown(true)}
                            onMouseLeave={() => setShowUserDropdown(false)}
                        >
                            <button className="flex items-center gap-2 px-2 lg:px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 transition-colors cursor-pointer">
                                <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow">
                                    {username.charAt(0).toUpperCase()}
                                </div>
                                <div className="hidden lg:block text-right">
                                    <p className="text-gray-800 font-semibold text-xs leading-tight">{username}</p>
                                    <p className="text-[10px] text-blue-600 font-medium">{role}</p>
                                </div>
                                <ChevronDown size={14} className={`hidden lg:block transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showUserDropdown && (
                                <div className="absolute right-0 top-full mt-0 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                                    <div className="px-3 py-2 border-b border-gray-100 lg:hidden">
                                        <p className="text-gray-800 font-semibold text-sm">{username}</p>
                                        <p className="text-xs text-blue-600">{role}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigate('/change-password');
                                            setShowUserDropdown(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2 text-sm"
                                    >
                                        <User size={16} />
                                        <span className="font-medium">Change Password</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setShowUserDropdown(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 text-sm"
                                    >
                                        <LogOut size={16} />
                                        <span className="font-medium">Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {showMobileMenu && (
                    <div className="md:hidden mt-3 pt-3 border-t border-gray-200">
                        <div className="space-y-1">
                            {role === 'Admin' && (
                                <>
                                    <MobileNavItem path="/" icon={Home} label="Dashboard" />
                                    <MobileNavItem path="/inventory/view" icon={Package} label="Inventory" />
                                    <MobileNavItem path="/inventory/add" icon={Plus} label="Add Battery" />
                                    <MobileNavItem path="/return-history" icon={History} label="Return History" />
                                    <MobileNavItem path="/sales" icon={BarChart3} label="Sales Reports" />
                                    <MobileNavItem path="/customers" icon={Users} label="Customers" />
                                    <MobileNavItem path="/users" icon={Users} label="User Management" />
                                </>
                            )}
                            <MobileNavItem path="/pos" icon={ShoppingCart} label="Point of Sale" />
                            
                            <div className="border-t border-gray-200 my-2 pt-2">
                                <div className="flex items-center gap-3 px-4 py-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow">
                                        {username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-gray-800 font-semibold">{username}</p>
                                        <p className="text-xs text-blue-600 font-medium">{role}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        navigate('/change-password');
                                        setShowMobileMenu(false);
                                    }}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <User size={20} />
                                    <span className="font-medium">Change Password</span>
                                </button>
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setShowMobileMenu(false);
                                    }}
                                    className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <LogOut size={20} />
                                    <span className="font-medium">Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
