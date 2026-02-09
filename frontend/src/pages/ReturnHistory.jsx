import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Toast from '../components/Toast';
import Dialog from '../components/Dialog';
import { RotateCcw, Search, Calendar, Filter, Eye, X, DollarSign, Package, Loader2, History } from 'lucide-react';
import { API_ENDPOINTS, APP_CONFIG } from '../constants/constants';

const ReturnHistory = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [returns, setReturns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [selectedReturn, setSelectedReturn] = useState(null);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCompensationType, setFilterCompensationType] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    
    useEffect(() => {
        fetchReturns();
    }, []);
    
    const fetchReturns = async () => {
        try {
            setIsLoading(true);
            const res = await axios.get(API_ENDPOINTS.RETURN, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setReturns(res.data);
        } catch (err) {
            console.error('Error fetching returns:', err);
            setToast({ message: 'Failed to load return history', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };
    
    // Filter and search returns
    const getFilteredReturns = () => {
        let filtered = [...returns];
        
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
                r.serialNumber?.toLowerCase().includes(query) ||
                r.brand?.toLowerCase().includes(query) ||
                r.model?.toLowerCase().includes(query) ||
                r.returnedBy?.toLowerCase().includes(query)
            );
        }
        
        // Status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(r => r.status === filterStatus);
        }
        
        // Compensation type filter
        if (filterCompensationType !== 'all') {
            filtered = filtered.filter(r => r.compensationType === filterCompensationType);
        }
        
        // Date range filter
        if (dateFrom) {
            const fromDate = new Date(dateFrom);
            filtered = filtered.filter(r => new Date(r.returnDate) >= fromDate);
        }
        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(r => new Date(r.returnDate) <= toDate);
        }
        
        // Sort by return date descending (most recent first)
        filtered.sort((a, b) => new Date(b.returnDate) - new Date(a.returnDate));
        
        return filtered;
    };
    
    const filteredReturns = getFilteredReturns();
    
    const clearFilters = () => {
        setSearchQuery('');
        setFilterStatus('all');
        setFilterCompensationType('all');
        setDateFrom('');
        setDateTo('');
    };
    
    const getStatusBadge = (status) => {
        const styles = {
            'Completed': 'bg-green-100 text-green-700 border-green-200',
            'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-200'
        };
        return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
    };
    
    const getCompensationBadge = (type) => {
        if (type === 'Money') {
            return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        }
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-8">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <History className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                    Return History
                                </h1>
                                <p className="text-gray-600 mt-1">View and manage battery return records</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Loader2 size={48} className="animate-spin text-orange-600 mx-auto mb-4" />
                            <p className="text-gray-600 font-medium">Loading return history...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Search and Filters */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-800">Search & Filters</h3>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                                >
                                    <Filter size={16} />
                                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                                </button>
                            </div>
                            
                            {/* Search */}
                            <div className="relative mb-4">
                                <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by serial number, brand, model, or user..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none transition-all"
                                />
                            </div>
                            
                            {/* Advanced Filters */}
                            {showFilters && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                                    {/* Status Filter */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 outline-none transition-all"
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Pending">Pending</option>
                                        </select>
                                    </div>
                                    
                                    {/* Compensation Type Filter */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Compensation Type</label>
                                        <select
                                            value={filterCompensationType}
                                            onChange={(e) => setFilterCompensationType(e.target.value)}
                                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 outline-none transition-all"
                                        >
                                            <option value="all">All Types</option>
                                            <option value="Money">Money</option>
                                            <option value="Replacement">Replacement</option>
                                        </select>
                                    </div>
                                    
                                    {/* Date From */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
                                        <input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 outline-none transition-all"
                                        />
                                    </div>
                                    
                                    {/* Date To */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
                                        <input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            )}
                            
                            {/* Results count & Clear */}
                            <div className="flex justify-between items-center mt-4">
                                <div className="text-sm text-gray-600">
                                    Showing <span className="font-bold text-orange-600">{filteredReturns.length}</span> of <span className="font-bold">{returns.length}</span> returns
                                </div>
                                {(searchQuery || filterStatus !== 'all' || filterCompensationType !== 'all' || dateFrom || dateTo) && (
                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
                                    >
                                        <X size={16} />
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {/* Returns - Empty State */}
                        {filteredReturns.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
                                <RotateCcw size={48} className="text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-600 mb-2">No Returns Found</h3>
                                <p className="text-gray-500">
                                    {returns.length === 0 
                                        ? 'No battery returns have been recorded yet.' 
                                        : 'No returns match your search criteria.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Mobile Card View */}
                                <div className="lg:hidden space-y-4">
                                    {filteredReturns.map((returnItem) => (
                                        <div key={returnItem.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
                                            {/* Header with Date & Status */}
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={16} className="text-gray-400" />
                                                    <span className="text-gray-800 font-medium">
                                                        {new Date(returnItem.returnDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusBadge(returnItem.status)}`}>
                                                    {returnItem.status}
                                                </span>
                                            </div>

                                            {/* Battery Info */}
                                            <div className="mb-3 pb-3 border-b border-gray-200">
                                                <p className="text-xs text-gray-500">Battery</p>
                                                <p className="font-bold text-gray-800">{returnItem.serialNumber}</p>
                                                <p className="text-sm text-gray-600">{returnItem.brand} - {returnItem.model}</p>
                                            </div>

                                            {/* Compensation */}
                                            <div className="flex gap-4 mb-3">
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-500">Compensation</p>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getCompensationBadge(returnItem.compensationType)}`}>
                                                        {returnItem.compensationType === 'Money' ? (
                                                            <DollarSign size={12} />
                                                        ) : (
                                                            <Package size={12} />
                                                        )}
                                                        {returnItem.compensationType}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs text-gray-500">
                                                        {returnItem.compensationType === 'Money' ? 'Amount' : 'Replacement'}
                                                    </p>
                                                    {returnItem.compensationType === 'Money' ? (
                                                        <p className="font-bold text-green-600">
                                                            {APP_CONFIG.CURRENCY} {returnItem.moneyAmount?.toLocaleString() || '0'}
                                                        </p>
                                                    ) : (
                                                        <p className="font-medium text-blue-600 text-sm">
                                                            {returnItem.replacementSerialNumber || 'Battery Added'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Returned By */}
                                            <div className="mb-3">
                                                <p className="text-xs text-gray-500">Returned By</p>
                                                <p className="font-medium text-gray-700">{returnItem.returnedBy}</p>
                                            </div>

                                            {/* Action */}
                                            <div className="flex justify-end pt-3 border-t border-gray-200">
                                                <button
                                                    onClick={() => setSelectedReturn(returnItem)}
                                                    className="flex items-center gap-1 px-3 py-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all text-sm font-medium"
                                                >
                                                    <Eye size={16} /> View Details
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden lg:block bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gradient-to-r from-orange-500 to-red-600">
                                                    <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">Date</th>
                                                    <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">Battery</th>
                                                    <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">Compensation</th>
                                                    <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">Amount/Replacement</th>
                                                    <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">Returned By</th>
                                                    <th className="px-6 py-4 text-right text-sm font-bold text-white uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredReturns.map((returnItem) => (
                                                    <tr key={returnItem.id} className="border-b border-gray-200 hover:bg-orange-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar size={16} className="text-gray-400" />
                                                                <span className="text-gray-800 font-medium">
                                                                    {new Date(returnItem.returnDate).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <p className="font-bold text-gray-800">{returnItem.serialNumber}</p>
                                                                <p className="text-sm text-gray-500">{returnItem.brand} - {returnItem.model}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getCompensationBadge(returnItem.compensationType)}`}>
                                                                {returnItem.compensationType === 'Money' ? (
                                                                    <DollarSign size={14} />
                                                                ) : (
                                                                    <Package size={14} />
                                                                )}
                                                                {returnItem.compensationType}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {returnItem.compensationType === 'Money' ? (
                                                                <span className="font-bold text-green-600">
                                                                    {APP_CONFIG.CURRENCY} {returnItem.moneyAmount?.toLocaleString() || '0'}
                                                                </span>
                                                            ) : (
                                                                <span className="text-blue-600 font-medium">
                                                                    {returnItem.replacementSerialNumber || 'Replacement Battery'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(returnItem.status)}`}>
                                                                {returnItem.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-700">
                                                            {returnItem.returnedBy}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => setSelectedReturn(returnItem)}
                                                                className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-all"
                                                                title="View Details"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
            
            {/* Return Details Modal */}
            {selectedReturn && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-600 p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">Return Details</h2>
                            <button 
                                onClick={() => setSelectedReturn(null)} 
                                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Battery Info */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-bold text-lg text-gray-800 mb-3">Battery Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Serial Number</p>
                                        <p className="font-bold text-gray-800">{selectedReturn.serialNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Brand</p>
                                        <p className="font-bold text-gray-800">{selectedReturn.brand}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Model</p>
                                        <p className="font-bold text-gray-800">{selectedReturn.model}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Expiry Date</p>
                                        <p className="font-bold text-red-600">
                                            {new Date(selectedReturn.expiryDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Return Info */}
                            <div className="bg-orange-50 rounded-xl p-4">
                                <h3 className="font-bold text-lg text-gray-800 mb-3">Return Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Return Date</p>
                                        <p className="font-bold text-gray-800">
                                            {new Date(selectedReturn.returnDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Returned By</p>
                                        <p className="font-bold text-gray-800">{selectedReturn.returnedBy}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(selectedReturn.status)}`}>
                                            {selectedReturn.status}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Reason</p>
                                        <p className="font-bold text-gray-800">{selectedReturn.reason}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Compensation Info */}
                            <div className={`rounded-xl p-4 ${selectedReturn.compensationType === 'Money' ? 'bg-green-50' : 'bg-blue-50'}`}>
                                <h3 className="font-bold text-lg text-gray-800 mb-3">Compensation Details</h3>
                                <div className="flex items-center gap-3 mb-3">
                                    {selectedReturn.compensationType === 'Money' ? (
                                        <DollarSign size={24} className="text-green-600" />
                                    ) : (
                                        <Package size={24} className="text-blue-600" />
                                    )}
                                    <span className={`text-xl font-bold ${selectedReturn.compensationType === 'Money' ? 'text-green-600' : 'text-blue-600'}`}>
                                        {selectedReturn.compensationType}
                                    </span>
                                </div>
                                {selectedReturn.compensationType === 'Money' && (
                                    <div>
                                        <p className="text-sm text-gray-500">Refund Amount</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {APP_CONFIG.CURRENCY} {selectedReturn.moneyAmount?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                )}
                                {selectedReturn.compensationType === 'Replacement' && (
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-500">Replacement Battery Serial Number</p>
                                            <p className="font-bold text-blue-600">{selectedReturn.replacementSerialNumber || 'N/A'}</p>
                                        </div>
                                        {selectedReturn.replacementSalesRep && (
                                            <div>
                                                <p className="text-sm text-gray-500">Sales Rep</p>
                                                <p className="font-bold text-gray-800">{selectedReturn.replacementSalesRep}</p>
                                            </div>
                                        )}
                                        {selectedReturn.replacementInvoiceNumber && (
                                            <div>
                                                <p className="text-sm text-gray-500">Invoice Number</p>
                                                <p className="font-bold text-gray-800">{selectedReturn.replacementInvoiceNumber}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Notes */}
                            {selectedReturn.notes && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="font-bold text-lg text-gray-800 mb-2">Notes</h3>
                                    <p className="text-gray-600">{selectedReturn.notes}</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-6 border-t border-gray-200">
                            <button
                                onClick={() => setSelectedReturn(null)}
                                className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default ReturnHistory;

