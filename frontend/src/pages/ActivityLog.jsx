import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { ScrollText, Search, Filter, ChevronLeft, ChevronRight, Activity, Battery, ShoppingCart, RotateCcw, Users, LogIn, RefreshCw, Calendar } from 'lucide-react';
import { API_ENDPOINTS } from '../constants/constants';
import PageHeader from '../components/PageHeader';

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
        <div className="min-h-screen bg-gray-100">
            <div className="w-full max-w-[1400px] mx-auto p-2 sm:p-3 space-y-3">
                {/* Header */}
                <PageHeader title="Activity Log" />

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-white rounded border border-gray-300 p-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center">
                                <Activity size={16} className="text-[#2563eb]" />
                            </div>
                            <div>
                                <p className="text-lg font-extrabold text-gray-900">{stats?.total || 0}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Total Logs</p>
                            </div>
                        </div>
                    </div>
                    {[
                        { type: 'Battery', icon: Battery, color: 'blue' },
                        { type: 'Sale', icon: ShoppingCart, color: 'green' },
                        { type: 'Return', icon: RotateCcw, color: 'orange' },
                        { type: 'Auth', icon: LogIn, color: 'purple' },
                    ].map(({ type, icon: Icon, color }) => (
                        <div key={type} className={`bg-white rounded border p-3 shadow-sm cursor-pointer hover:border-[#2563eb] transition-all ${entityType === type ? 'border-[#2563eb] bg-blue-50' : 'border-gray-300'}`}
                            onClick={() => { setEntityType(entityType === type ? '' : type); setPage(1); }}>
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 bg-${color}-50 rounded flex items-center justify-center`}>
                                    <Icon size={16} className={`text-${color}-600`} />
                                </div>
                                <div>
                                    <p className="text-lg font-extrabold text-gray-900">{getStatCount(type)}</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">{type}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search & Filters */}
                <div className="bg-white rounded shadow-sm border border-gray-300 overflow-hidden">
                    <div className="p-3 flex flex-col md:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search activities by description, user, or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:border-[#2563eb] outline-none transition-all text-sm"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded border font-bold text-xs transition-all ${showFilters ? 'bg-blue-50 border-[#2563eb] text-[#2563eb]' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Filter size={14} />
                            Filters
                            {hasActiveFilters && <span className="w-1.5 h-1.5 bg-[#2563eb] rounded-full"></span>}
                        </button>
                        <button
                            onClick={() => { fetchLogs(); fetchStats(); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 font-bold text-xs transition-all"
                        >
                            <RefreshCw size={14} />
                            Refresh
                        </button>
                    </div>

                    {/* Expandable Filters */}
                    {showFilters && (
                        <div className="px-3 pb-3 border-t border-gray-200 pt-3">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Entity Type</label>
                                    <select
                                        value={entityType}
                                        onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-[#2563eb] outline-none"
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
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Action</label>
                                    <select
                                        value={action}
                                        onChange={(e) => { setAction(e.target.value); setPage(1); }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-[#2563eb] outline-none"
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
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-[#2563eb] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-[#2563eb] outline-none"
                                    />
                                </div>
                            </div>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="mt-2 text-xs text-[#2563eb] hover:text-[#1d4ed8] font-bold"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Log Table */}
                <div className="bg-white rounded shadow-sm border border-gray-300 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-[#2563eb] text-white text-left">
                                    <th className="px-3 py-2 text-xs font-bold uppercase">Time</th>
                                    <th className="px-3 py-2 text-xs font-bold uppercase">User</th>
                                    <th className="px-3 py-2 text-xs font-bold uppercase">Action</th>
                                    <th className="px-3 py-2 text-xs font-bold uppercase">Type</th>
                                    <th className="px-3 py-2 text-xs font-bold uppercase">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="py-10 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <RefreshCw size={24} className="animate-spin text-[#2563eb]" />
                                                <p className="font-bold text-sm">Loading activity logs...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-10 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <ScrollText size={24} className="opacity-30" />
                                                <p className="font-bold text-sm">No activity logs found</p>
                                                <p className="text-xs">Activities will appear here as users interact with the system</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log, index) => (
                                        <tr key={log.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 transition-colors border-b border-gray-200`}>
                                            <td className="px-3 py-2">
                                                <span className="text-xs text-gray-700 font-bold">{formatDate(log.timestamp)}</span>
                                                <p className="text-[10px] text-gray-400">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </p>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="text-xs font-bold text-gray-800">
                                                    {log.username || 'System'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getActionBadge(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${getEntityBadge(log.entityType)}`}>
                                                    {getEntityIcon(log.entityType)}
                                                    {log.entityType}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <p className="text-xs text-gray-700 max-w-md truncate" title={log.description}>
                                                    {log.description}
                                                </p>
                                                {log.entityId && (
                                                    <p className="text-[10px] text-gray-400 font-mono">ID: {log.entityId}</p>
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
                        <div className="flex items-center justify-between px-3 py-3 border-t border-gray-200 bg-gray-50">
                            <p className="text-xs text-gray-600">
                                Showing <span className="font-bold">{((page - 1) * PAGE_SIZE) + 1}</span> to{' '}
                                <span className="font-bold">{Math.min(page * PAGE_SIZE, totalCount)}</span> of{' '}
                                <span className="font-bold">{totalCount}</span>
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="flex items-center gap-1 px-2 py-1.5 rounded border border-gray-300 text-xs font-bold text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={14} /> Prev
                                </button>
                                <div className="flex items-center gap-0.5">
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
                                                className={`w-8 h-8 rounded text-xs font-bold transition-all ${page === pageNum
                                                    ? 'bg-[#2563eb] text-white'
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
                                    className="flex items-center gap-1 px-2 py-1.5 rounded border border-gray-300 text-xs font-bold text-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Next <ChevronRight size={14} />
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
