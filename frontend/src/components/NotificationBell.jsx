import { useState, useEffect, useContext } from 'react';
import { Bell, AlertTriangle, Battery, X, Package } from 'lucide-react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { API_ENDPOINTS, APP_CONFIG } from '../constants/constants';

const NotificationBell = () => {
    const { user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dismissedIds, setDismissedIds] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
        } catch {
            return [];
        }
    });

    useEffect(() => {
        if (user?.role === 'Admin') {
            fetchNotifications();
            // Refresh every 5 minutes
            const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchNotifications = async () => {
        if (!user?.token) return;
        
        try {
            setLoading(true);
            const res = await axios.get(API_ENDPOINTS.BATTERY, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            
            const batteries = res.data;
            const alerts = [];
            const today = new Date();
            const oneMonthFromNow = new Date();
            oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + APP_CONFIG.EXPIRING_SOON_MONTHS);

            batteries.forEach(battery => {
                // Check for low stock
                if (battery.stockQuantity > 0 && battery.stockQuantity <= APP_CONFIG.LOW_STOCK_THRESHOLD) {
                    alerts.push({
                        id: `low-stock-${battery.id}`,
                        type: 'low-stock',
                        title: 'Low Stock',
                        message: `${battery.brand} ${battery.model} has only ${battery.stockQuantity} units left`,
                        batteryId: battery.id,
                        severity: battery.stockQuantity <= 2 ? 'high' : 'medium'
                    });
                }

                // Check for expiring soon
                const purchaseDate = new Date(battery.purchaseDate);
                const expiryDate = new Date(purchaseDate);
                expiryDate.setMonth(expiryDate.getMonth() + (battery.shelfLifeMonths || 12));

                if (expiryDate <= today && battery.stockQuantity > 0) {
                    alerts.push({
                        id: `expired-${battery.id}`,
                        type: 'expired',
                        title: 'Expired',
                        message: `${battery.brand} ${battery.model} (${battery.serialNumber}) has expired`,
                        batteryId: battery.id,
                        severity: 'high'
                    });
                } else if (expiryDate <= oneMonthFromNow && expiryDate > today && battery.stockQuantity > 0) {
                    alerts.push({
                        id: `expiring-${battery.id}`,
                        type: 'expiring',
                        title: 'Expiring Soon',
                        message: `${battery.brand} ${battery.model} expires on ${expiryDate.toLocaleDateString()}`,
                        batteryId: battery.id,
                        severity: 'medium'
                    });
                }
            });

            const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
            setNotifications(alerts.filter(a => !dismissed.includes(a.id)));
        } catch (err) {
            // Silently fail - notifications are not critical
        } finally {
            setLoading(false);
        }
    };

    const dismissNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setDismissedIds(prev => {
            const updated = [...prev, id];
            localStorage.setItem('dismissed_notifications', JSON.stringify(updated));
            return updated;
        });
    };

    const dismissAll = () => {
        const allIds = notifications.map(n => n.id);
        setDismissedIds(prev => {
            const updated = [...new Set([...prev, ...allIds])];
            localStorage.setItem('dismissed_notifications', JSON.stringify(updated));
            return updated;
        });
        setNotifications([]);
        setShowDropdown(false);
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'low-stock':
                return <Package size={16} className="text-orange-500" />;
            case 'expired':
                return <AlertTriangle size={16} className="text-red-500" />;
            case 'expiring':
                return <Battery size={16} className="text-yellow-500" />;
            default:
                return <Bell size={16} />;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high':
                return 'border-l-red-500 bg-red-50';
            case 'medium':
                return 'border-l-orange-500 bg-orange-50';
            default:
                return 'border-l-blue-500 bg-blue-50';
        }
    };

    if (user?.role !== 'Admin') return null;

    const unreadCount = notifications.length;
    const hasHighPriority = notifications.some(n => n.severity === 'high');

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`relative p-2 rounded-lg transition-colors ${
                    hasHighPriority 
                        ? 'text-red-600 hover:bg-red-100' 
                        : unreadCount > 0 
                            ? 'text-orange-600 hover:bg-orange-100' 
                            : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-bold text-white rounded-full ${
                        hasHighPriority ? 'bg-red-500' : 'bg-orange-500'
                    }`}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 flex items-center justify-between">
                            <h3 className="text-white font-bold">Notifications</h3>
                            <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                                {unreadCount} alerts
                            </span>
                        </div>
                        
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-gray-500">
                                    Loading...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="font-medium">All clear!</p>
                                    <p className="text-sm">No alerts at this time</p>
                                </div>
                            ) : (
                                notifications.map(notification => (
                                    <div 
                                        key={notification.id}
                                        className={`p-3 border-l-4 ${getSeverityColor(notification.severity)} border-b border-gray-100 last:border-b-0`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-800 text-sm">
                                                    {notification.title}
                                                </p>
                                                <p className="text-gray-600 text-xs mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => dismissNotification(notification.id)}
                                                className="text-gray-400 hover:text-gray-600 p-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        {notifications.length > 0 && (
                            <div className="p-2 bg-gray-50 border-t">
                                <button
                                    onClick={dismissAll}
                                    className="w-full text-center text-sm text-gray-600 hover:text-gray-800 py-1"
                                >
                                    Dismiss all
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;


