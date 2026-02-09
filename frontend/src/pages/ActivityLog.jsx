import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { ScrollText, Search, Filter, ChevronLeft, ChevronRight, Activity, Battery, ShoppingCart, RotateCcw, Users, LogIn, RefreshCw, Calendar } from 'lucide-react';
import { API_ENDPOINTS } from '../constants/constants';

const ActivityLog = () => {
    const { user } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Filters
    const [entityType, setEntityType] = useState('');
    const [action, setAction] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const PAGE_SIZE = 30;

    useEffect(() => {
        fetchLogs();
    }, [page, entityType, action, startDate, endDate]);

    useEffect(() => {
        fetchStats();
    }, [startDate, endDate]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (page === 1) fetchLogs();
            else setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('pageSize', PAGE_SIZE);
            if (entityType) params.append('entityType', entityType);
            if (action) params.append('action', action);
            if (searchTerm) params.append('search', searchTerm);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const res = await axios.get(`${API_ENDPOINTS.ACTIVITY_LOG}?${params}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setLogs(res.data.items);
            setTotalPages(res.data.totalPages);
            setTotalCount(res.data.totalCount);
        } catch (err) {
            console.error('Error fetching logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const res = await axios.get(`${API_ENDPOINTS.ACTIVITY_LOG}/stats?${params}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setStats(res.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const clearFilters = () => {
        setEntityType('');
        setAction('');
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    const getActionBadge = (action) => {
        const styles = {
            Created: 'bg-green-100 text-green-700',
            Updated: 'bg-blue-100 text-blue-700',
            Deleted: 'bg-red-100 text-red-700',
            Login: 'bg-purple-100 text-purple-700',
            LoginFailed: 'bg-orange-100 text-orange-700',
            PasswordChanged: 'bg-yellow-100 text-yellow-700',
        };
        return styles[action] || 'bg-gray-100 text-gray-700';
    };

    const getEntityIcon = (type) => {
        switch (type) {
            case 'Battery': return <Battery size={16} className="text-blue-500" />;
            case 'Sale': return <ShoppingCart size={16} className="text-green-500" />;
            case 'Return': return <RotateCcw size={16} className="text-orange-500" />;
            case 'User': return <Users size={16} className="text-purple-500" />;
            case 'Auth': return <LogIn size={16} className="text-indigo-500" />;
            default: return <Activity size={16} className="text-gray-500" />;
        }
    };

    const getEntityBadge = (type) => {
        const styles = {
            Battery: 'bg-blue-50 text-blue-700 border-blue-200',
            Sale: 'bg-green-50 text-green-700 border-green-200',
            Return: 'bg-orange-50 text-orange-700 border-orange-200',
            User: 'bg-purple-50 text-purple-700 border-purple-200',
            Auth: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
        return styles[type] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getStatCount = (entityTypeName) => {
        if (!stats?.byEntityType) return 0;
        const found = stats.byEntityType.find(e => e.type === entityTypeName);
        return found?.count || 0;
    };

    const hasActiveFilters = entityType || action || searchTerm || startDate || endDate;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-8">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <ScrollText className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Activity Log
                            </h1>
                            <p className="text-gray-600 mt-1">Track all system activities and user actions</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <Activity size={20} className="text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
                                <p className="text-xs text-gray-500 font-medium">Total Logs</p>
                            </div>
                        </div>
                    </div>
                    {[
                        { type: 'Battery', icon: Battery, color: 'blue' },
                        { type: 'Sale', icon: ShoppingCart, color: 'green' },
                        { type: 'Return', icon: RotateCcw, color: 'orange' },
                        { type: 'Auth', icon: LogIn, color: 'purple' },
                    ].map(({ type, icon: Icon, color }) => (
                        <div key={type} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => { setEntityType(entityType === type ? '' : type); setPage(1); }}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                                    <Icon size={20} className={`text-${color}-600`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{getStatCount(type)}</p>
                                    <p className="text-xs text-gray-500 font-medium">{type}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search & Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
                    <div className="p-4 flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search activities by description, user, or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 outline-none transition-all text-sm"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Filter size={16} />
                            Filters
                            {hasActiveFilters && <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>}
                        </button>
                        <button
                            onClick={() => { fetchLogs(); fetchStats(); }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm transition-all"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>

                    {/* Expandable Filters */}
                    {showFilters && (
                        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Entity Type</label>
                                    <select
                                        value={entityType}
                                        onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                                    >
                                        <option value="">All Types</option>
                                        <option value="Battery">Battery</option>
                                        <option value="Sale">Sale</option>
                                        <option value="Return">Return</option>
                                        <option value="User">User</option>
                                        <option value="Auth">Auth</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Action</label>
                                    <select
                                        value={action}
                                        onChange={(e) => { setAction(e.target.value); setPage(1); }}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                                    >
                                        <option value="">All Actions</option>
                                        <option value="Created">Created</option>
                                        <option value="Updated">Updated</option>
                                        <option value="Deleted">Deleted</option>
                                        <option value="Login">Login</option>
                                        <option value="LoginFailed">Login Failed</option>
                                        <option value="PasswordChanged">Password Changed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Log Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase">Time</th>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase">User</th>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase">Action</th>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase">Description</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="py-16 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <RefreshCw size={32} className="animate-spin text-indigo-400" />
                                                <p className="font-medium">Loading activity logs...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-16 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <ScrollText size={40} className="opacity-30" />
                                                <p className="font-medium">No activity logs found</p>
                                                <p className="text-sm">Activities will appear here as users interact with the system</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-gray-400" />
                                                    <span className="text-sm text-gray-700 font-medium">{formatDate(log.timestamp)}</span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5 ml-6">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </p>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className="text-sm font-semibold text-gray-800">
                                                    {log.username || 'System'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getActionBadge(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getEntityBadge(log.entityType)}`}>
                                                    {getEntityIcon(log.entityType)}
                                                    {log.entityType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <p className="text-sm text-gray-700 max-w-md truncate" title={log.description}>
                                                    {log.description}
                                                </p>
                                                {log.entityId && (
                                                    <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {log.entityId}</p>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <p className="text-sm text-gray-600">
                                Showing <span className="font-semibold">{((page - 1) * PAGE_SIZE) + 1}</span> to{' '}
                                <span className="font-semibold">{Math.min(page * PAGE_SIZE, totalCount)}</span> of{' '}
                                <span className="font-semibold">{totalCount}</span> entries
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = page - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${page === pageNum
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'text-gray-600 hover:bg-white border border-transparent hover:border-gray-300'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityLog;
