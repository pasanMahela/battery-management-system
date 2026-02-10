import { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Home, Package, ShoppingCart, BarChart3, LogOut, User, ChevronDown, Plus, Users, History, Menu, X, ScrollText, Edit2, ClipboardList } from 'lucide-react';
import { APP_CONFIG } from '../constants/constants';
import NotificationBell from './NotificationBell';
import ScannerStatusIndicator from './ScannerStatusIndicator';

const Header = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const role = user?.role || 'Unknown';
    const username = user?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || user?.name || 'User';
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
    };

    // Desktop Nav Button
    const NavButton = ({ path, icon: Icon, label, className = '' }) => (
        <button
            onClick={() => handleNavigation(path)}
            className={`flex items-center gap-1 px-2 py-1 rounded font-bold transition-all text-xs whitespace-nowrap ${isActive(path)
                ? 'bg-[#2563eb] text-white'
                : 'text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]'
                } ${className}`}
        >
            <Icon size={14} />
            <span className="hidden xl:inline">{label}</span>
        </button>
    );

    // Mobile Nav Item
    const MobileNavItem = ({ path, icon: Icon, label }) => (
        <button
            onClick={() => handleNavigation(path)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded font-bold transition-all ${isActive(path)
                ? 'bg-[#2563eb] text-white'
                : 'text-gray-700 hover:bg-blue-50'
                }`}
        >
            <Icon size={20} />
            <span>{label}</span>
        </button>
    );

    return (
        <header className="bg-white border-b border-gray-300 shadow-sm sticky top-0 z-50">
            <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 py-1.5">
                <div className="flex justify-between items-center">
                    {/* Logo & Brand */}
                    <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-8 h-8 bg-[#2563eb] rounded flex items-center justify-center">
                            <span className="text-white font-extrabold text-lg">R</span>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1 lg:gap-2">
                        <NavButton path="/pos" icon={ShoppingCart} label="POS" />

                        {role === 'Admin' && (
                            <>
                                <NavButton path="/inventory/add" icon={Plus} label="Add Battery" />
                                <NavButton path="/inventory/view" icon={Package} label="View Battery" />
                                <NavButton path="/inventory/edit" icon={Edit2} label="Edit Battery" />
                                <NavButton path="/return-history" icon={History} label="Return History" />
                                <NavButton path="/sales" icon={BarChart3} label="Sales" />
                                <NavButton path="/purchase-history" icon={ClipboardList} label="Purchases" />
                                <NavButton path="/customers" icon={Users} label="Customers" />
                                <NavButton path="/users" icon={Users} label="Users" />
                                <NavButton path="/activity-log" icon={ScrollText} label="Logs" />
                                <NavButton path="/dashboard" icon={Home} label="Dashboard" />
                            </>
                        )}
                    </nav>

                    {/* Right Side - User & Mobile Menu */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* Phone Scanner Connect / Status */}
                        <ScannerStatusIndicator />

                        {/* Notification Bell */}
                        <NotificationBell />
                        
                        {/* User Dropdown - Desktop */}
                        <div className="relative hidden md:block"
                            onMouseEnter={() => setShowUserDropdown(true)}
                            onMouseLeave={() => setShowUserDropdown(false)}
                        >
                            <button className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors cursor-pointer">
                                <div className="w-6 h-6 bg-[#2563eb] rounded-full flex items-center justify-center text-white text-xs font-bold">
                                    {username.charAt(0).toUpperCase()}
                                </div>
                                <div className="hidden lg:block text-right">
                                    <p className="text-gray-800 font-bold text-[11px] leading-tight">{username}</p>
                                    <p className="text-[9px] text-[#2563eb] font-bold">{role}</p>
                                </div>
                                <ChevronDown size={12} className={`hidden lg:block transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showUserDropdown && (
                                <div className="absolute right-0 top-full mt-0 w-48 bg-white rounded shadow-md border border-gray-300 py-1 z-50">
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
                            <MobileNavItem path="/pos" icon={ShoppingCart} label="Point of Sale" />
                            {role === 'Admin' && (
                                <>
                                    <MobileNavItem path="/inventory/add" icon={Plus} label="Add Battery" />
                                    <MobileNavItem path="/inventory/view" icon={Package} label="View Battery" />
                                    <MobileNavItem path="/inventory/edit" icon={Edit2} label="Edit Battery" />
                                    <MobileNavItem path="/return-history" icon={History} label="Return History" />
                                    <MobileNavItem path="/sales" icon={BarChart3} label="Sales" />
                                    <MobileNavItem path="/purchase-history" icon={ClipboardList} label="Purchase History" />
                                    <MobileNavItem path="/customers" icon={Users} label="Customers" />
                                    <MobileNavItem path="/users" icon={Users} label="Users" />
                                    <MobileNavItem path="/activity-log" icon={ScrollText} label="Activity Log" />
                                    <MobileNavItem path="/dashboard" icon={Home} label="Dashboard" />
                                </>
                            )}
                            
                            <div className="border-t border-gray-200 my-2 pt-2">
                                <div className="flex items-center gap-3 px-4 py-2">
                                    <div className="w-10 h-10 bg-[#2563eb] rounded-full flex items-center justify-center text-white font-bold">
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
