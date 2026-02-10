import { useState, useEffect, useContext, useMemo } from 'react';
import { ClipboardList, Search, Calendar, Package, DollarSign, Hash, RefreshCw, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import { API_ENDPOINTS, APP_CONFIG } from '../constants/constants';
import PageHeader from '../components/PageHeader';

const PAGE_SIZE = 20;

const PurchaseHistory = () => {
    const { user } = useContext(AuthContext);
    const [batteries, setBatteries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortBy, setSortBy] = useState('purchaseDate');
    const [sortOrder, setSortOrder] = useState('desc');
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchBatteries();
    }, []);

    const fetchBatteries = async () => {
        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.BATTERY, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBatteries(data);
            }
        } catch (err) {
            console.error('Failed to fetch batteries:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort
    const filtered = useMemo(() => {
        let result = [...batteries];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(b =>
                b.brand?.toLowerCase().includes(term) ||
                b.model?.toLowerCase().includes(term) ||
                b.serialNumber?.toLowerCase().includes(term) ||
                b.invoiceNumber?.toLowerCase().includes(term) ||
                b.salesRep?.toLowerCase().includes(term)
            );
        }

        // Date filters
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            result = result.filter(b => new Date(b.purchaseDate) >= start);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            result = result.filter(b => new Date(b.purchaseDate) <= end);
        }

        // Sort
        result.sort((a, b) => {
            let valA, valB;
            switch (sortBy) {
                case 'purchaseDate': valA = new Date(a.purchaseDate); valB = new Date(b.purchaseDate); break;
                case 'brand': valA = a.brand?.toLowerCase() || ''; valB = b.brand?.toLowerCase() || ''; break;
                case 'purchasePrice': valA = a.purchasePrice; valB = b.purchasePrice; break;
                case 'totalCost': valA = a.purchasePrice * a.stockQuantity; valB = b.purchasePrice * b.stockQuantity; break;
                case 'stockQuantity': valA = a.stockQuantity; valB = b.stockQuantity; break;
                default: valA = new Date(a.purchaseDate); valB = new Date(b.purchaseDate);
            }
            if (sortOrder === 'asc') return valA > valB ? 1 : -1;
            return valA < valB ? 1 : -1;
        });

        return result;
    }, [batteries, searchTerm, startDate, endDate, sortBy, sortOrder]);

    // Pagination
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Stats
    const totalPurchaseCost = filtered.reduce((sum, b) => sum + (b.purchasePrice * b.stockQuantity), 0);
    const totalItems = filtered.reduce((sum, b) => sum + b.stockQuantity, 0);
    const uniqueInvoices = new Set(filtered.filter(b => b.invoiceNumber).map(b => b.invoiceNumber)).size;

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
        setPage(1);
    };

    const SortIcon = ({ column }) => {
        if (sortBy !== column) return <span className="text-white/50 text-[10px] ml-0.5">↕</span>;
        return <span className="text-white text-[10px] ml-0.5">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
        setSortBy('purchaseDate');
        setSortOrder('desc');
        setPage(1);
    };

    const hasActiveFilters = searchTerm || startDate || endDate;

    const exportCSV = () => {
        const headers = ['Purchase Date', 'Invoice #', 'Brand', 'Model', 'Serial Number', 'Qty', 'Unit Price', 'Total Cost', 'Sales Rep'];
        const rows = filtered.map(b => [
            new Date(b.purchaseDate).toLocaleDateString(),
            b.invoiceNumber || '-',
            b.brand,
            b.model,
            b.serialNumber,
            b.stockQuantity,
            b.purchasePrice,
            (b.purchasePrice * b.stockQuantity).toFixed(2),
            b.salesRep || '-'
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `purchase-history-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="w-full max-w-[1400px] mx-auto p-2 sm:p-3 space-y-3">
                <PageHeader title="Purchase History" />

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded border border-gray-300 p-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center">
                                <Package size={16} className="text-[#2563eb]" />
                            </div>
                            <div>
                                <p className="text-lg font-extrabold text-gray-900">{filtered.length}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Products</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded border border-gray-300 p-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-50 rounded flex items-center justify-center">
                                <Hash size={16} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-lg font-extrabold text-gray-900">{totalItems.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Total Qty</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded border border-gray-300 p-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-50 rounded flex items-center justify-center">
                                <DollarSign size={16} className="text-purple-600" />
                            </div>
                            <div>
                                <p className="text-lg font-extrabold text-gray-900">{APP_CONFIG.CURRENCY} {totalPurchaseCost.toLocaleString()}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Total Cost</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded border border-gray-300 p-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-50 rounded flex items-center justify-center">
                                <ClipboardList size={16} className="text-orange-600" />
                            </div>
                            <div>
                                <p className="text-lg font-extrabold text-gray-900">{uniqueInvoices}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Invoices</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="bg-white rounded shadow-sm border border-gray-300 overflow-hidden">
                    <div className="p-3 flex flex-col md:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search by brand, model, serial, invoice or rep..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:border-[#2563eb] outline-none transition-all text-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                    className="pl-8 pr-2 py-2 border border-gray-300 rounded focus:border-[#2563eb] outline-none text-sm"
                                    placeholder="From"
                                />
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                    className="pl-8 pr-2 py-2 border border-gray-300 rounded focus:border-[#2563eb] outline-none text-sm"
                                    placeholder="To"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="px-3 py-2 text-xs text-[#2563eb] hover:bg-blue-50 rounded border border-gray-300 font-bold transition-all">
                                    Clear
                                </button>
                            )}
                            <button onClick={fetchBatteries} className="flex items-center gap-1.5 px-3 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 font-bold text-xs transition-all">
                                <RefreshCw size={14} />
                                Refresh
                            </button>
                            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#2563eb] text-white hover:bg-[#1d4ed8] font-bold text-xs transition-all">
                                <Download size={14} />
                                Export
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded shadow-sm border border-gray-300 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-[#2563eb] text-white text-left">
                                    <th className="px-3 py-2 text-xs font-bold uppercase cursor-pointer hover:bg-[#1d4ed8]" onClick={() => handleSort('purchaseDate')}>
                                        Date <SortIcon column="purchaseDate" />
                                    </th>
                                    <th className="px-3 py-2 text-xs font-bold uppercase">Invoice #</th>
                                    <th className="px-3 py-2 text-xs font-bold uppercase cursor-pointer hover:bg-[#1d4ed8]" onClick={() => handleSort('brand')}>
                                        Brand / Model <SortIcon column="brand" />
                                    </th>
                                    <th className="px-3 py-2 text-xs font-bold uppercase">Serial #</th>
                                    <th className="px-3 py-2 text-xs font-bold uppercase cursor-pointer hover:bg-[#1d4ed8] text-right" onClick={() => handleSort('stockQuantity')}>
                                        Qty <SortIcon column="stockQuantity" />
                                    </th>
                                    <th className="px-3 py-2 text-xs font-bold uppercase cursor-pointer hover:bg-[#1d4ed8] text-right" onClick={() => handleSort('purchasePrice')}>
                                        Unit Price <SortIcon column="purchasePrice" />
                                    </th>
                                    <th className="px-3 py-2 text-xs font-bold uppercase cursor-pointer hover:bg-[#1d4ed8] text-right" onClick={() => handleSort('totalCost')}>
                                        Total Cost <SortIcon column="totalCost" />
                                    </th>
                                    <th className="px-3 py-2 text-xs font-bold uppercase">Sell Price</th>
                                    <th className="px-3 py-2 text-xs font-bold uppercase">Margin</th>
                                    <th className="px-3 py-2 text-xs font-bold uppercase">Rep</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="10" className="py-10 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <RefreshCw size={24} className="animate-spin text-[#2563eb]" />
                                                <p className="font-bold text-sm">Loading purchase history...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginated.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="py-10 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <ClipboardList size={24} className="opacity-30" />
                                                <p className="font-bold text-sm">No purchase records found</p>
                                                <p className="text-xs">Try adjusting your search or filters</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginated.map((b, index) => {
                                        const totalCost = b.purchasePrice * b.stockQuantity;
                                        const margin = b.sellingPrice > 0 ? ((b.sellingPrice - b.purchasePrice) / b.purchasePrice * 100) : 0;
                                        return (
                                            <tr key={b.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 transition-colors border-b border-gray-200`}>
                                                <td className="px-3 py-2">
                                                    <span className="text-xs font-bold text-gray-700">
                                                        {new Date(b.purchaseDate).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className="text-xs text-gray-600 font-mono">
                                                        {b.invoiceNumber || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <p className="text-xs font-bold text-gray-800">{b.brand}</p>
                                                    <p className="text-[10px] text-gray-500">{b.model}</p>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className="text-xs text-gray-600 font-mono">{b.serialNumber}</span>
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <span className="text-xs font-bold text-gray-800">{b.stockQuantity}</span>
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <span className="text-xs text-gray-700">{APP_CONFIG.CURRENCY} {b.purchasePrice.toLocaleString()}</span>
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <span className="text-xs font-bold text-gray-900">{APP_CONFIG.CURRENCY} {totalCost.toLocaleString()}</span>
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <span className="text-xs text-gray-700">{APP_CONFIG.CURRENCY} {b.sellingPrice.toLocaleString()}</span>
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <span className={`text-xs font-bold ${margin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {margin > 0 ? '+' : ''}{margin.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className="text-xs text-gray-600">{b.salesRep || '-'}</span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-3 py-3 border-t border-gray-200 bg-gray-50">
                            <p className="text-xs text-gray-600">
                                Showing <span className="font-bold">{((page - 1) * PAGE_SIZE) + 1}</span> to{' '}
                                <span className="font-bold">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{' '}
                                <span className="font-bold">{filtered.length}</span>
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
                                        if (totalPages <= 5) pageNum = i + 1;
                                        else if (page <= 3) pageNum = i + 1;
                                        else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                        else pageNum = page - 2 + i;
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

export default PurchaseHistory;
