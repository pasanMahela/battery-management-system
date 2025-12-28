import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import PrintableBill from '../components/PrintableBill';
import { Search, Calendar, DollarSign, User, Phone, Package, ArrowUpDown, Filter, Download, FileText, Eye, Loader2, X } from 'lucide-react';
import { API_ENDPOINTS } from '../constants/constants';

const Sales = () => {
    const { user } = useContext(AuthContext);
    const [sales, setSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [timePeriod, setTimePeriod] = useState('today'); // 'today', 'week', 'month'

    // Sort
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    // Print State
    const [printingSale, setPrintingSale] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchSales();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [sales, searchTerm, startDate, endDate, sortConfig]);

    const fetchSales = async () => {
        try {
            setIsLoading(true);
            const res = await axios.get(API_ENDPOINTS.SALE, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setSales(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...sales];

        // 1. Text Search - includes customer details, cashier, and battery details
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(sale => {
                // Search in customer and cashier details
                const customerMatch = (sale.customerName?.toLowerCase() || '').includes(term) ||
                    (sale.customerPhone || '').includes(term) ||
                    (sale.customerId || '').includes(term) ||
                    (sale.cashierName?.toLowerCase() || '').includes(term);

                // Search in battery items (brand and model)
                const batteryMatch = sale.items?.some(item =>
                    (item.brand?.toLowerCase() || '').includes(term) ||
                    (item.model?.toLowerCase() || '').includes(term)
                ) || false;

                return customerMatch || batteryMatch;
            });
        }

        // 2. Date Range
        if (startDate) {
            result = result.filter(sale => new Date(sale.date) >= new Date(startDate));
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            result = result.filter(sale => new Date(sale.date) <= end);
        }

        // 3. Sorting
        result.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        setFilteredSales(result);
    };

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Calculate date range based on time period
    const getDateRange = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (timePeriod) {
            case 'today':
                return { start: today, end: new Date() };
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
                return { start: weekStart, end: new Date() };
            case 'month':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                return { start: monthStart, end: new Date() };
            default:
                return { start: today, end: new Date() };
        }
    };

    // Filter sales by time period
    const { start, end } = getDateRange();
    const periodSales = filteredSales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= start && saleDate <= end;
    });

    // Calculate metrics
    const totalSalesToday = periodSales.length;
    const totalRevenueToday = periodSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    // Calculate profit (Revenue - Cost)
    // Assuming each item has purchasePrice in the battery data
    const totalProfitToday = periodSales.reduce((sum, sale) => {
        const saleProfit = sale.items?.reduce((itemSum, item) => {
            // Profit = (selling price - purchase price) * quantity
            const itemProfit = (item.unitPrice - (item.purchasePrice || item.unitPrice * 0.7)) * item.quantity;
            return itemSum + itemProfit;
        }, 0) || 0;
        return sum + saleProfit;
    }, 0);

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="container mx-auto max-w-7xl">

                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Sales History</h1>
                        <p className="text-gray-500 mt-1">Track and manage your transaction records</p>
                    </div>
                    {/* Placeholder for Export Button */}
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                        <Download size={18} /> Export CSV
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Sales Overview</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTimePeriod('today')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${timePeriod === 'today'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setTimePeriod('week')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${timePeriod === 'week'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                This Week
                            </button>
                            <button
                                onClick={() => setTimePeriod('month')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${timePeriod === 'month'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                This Month
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-blue-700 uppercase tracking-wider">
                                    Total Sales {timePeriod === 'today' ? 'Today' : timePeriod === 'week' ? 'This Week' : 'This Month'}
                                </p>
                                <h3 className="text-4xl font-extrabold text-blue-900 mt-2">{totalSalesToday}</h3>
                                <p className="text-xs text-blue-600 mt-1">Transactions</p>
                            </div>
                            <div className="p-4 bg-blue-600 text-white rounded-xl">
                                <FileText size={28} />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-green-700 uppercase tracking-wider">
                                    Total Revenue {timePeriod === 'today' ? 'Today' : timePeriod === 'week' ? 'This Week' : 'This Month'}
                                </p>
                                <h3 className="text-4xl font-extrabold text-green-900 mt-2">LKR {totalRevenueToday.toLocaleString()}</h3>
                                <p className="text-xs text-green-600 mt-1">Total earnings</p>
                            </div>
                            <div className="p-4 bg-green-600 text-white rounded-xl">
                                <DollarSign size={28} />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-purple-700 uppercase tracking-wider">
                                    Total Profit {timePeriod === 'today' ? 'Today' : timePeriod === 'week' ? 'This Week' : 'This Month'}
                                </p>
                                <h3 className="text-4xl font-extrabold text-purple-900 mt-2">LKR {totalProfitToday.toLocaleString()}</h3>
                                <p className="text-xs text-purple-600 mt-1">Net earnings</p>
                            </div>
                            <div className="p-4 bg-purple-600 text-white rounded-xl">
                                <Package size={28} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-5 relative">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Search</label>
                            <Search className="absolute left-3 top-[34px] text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search customer, phone, battery brand, model..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">From Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">To Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setStartDate('');
                                    setEndDate('');
                                }}
                                className="w-full px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center"
                                title="Clear Filters"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filtered Results Summary - Dynamic based on search and date filters */}
                {(searchTerm || startDate || endDate) && (
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-5 mb-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold">Filtered Results</h3>
                                <p className="text-sm text-blue-100">
                                    {searchTerm && `Search: "${searchTerm}"`}
                                    {(searchTerm && (startDate || endDate)) && ' • '}
                                    {startDate && `From: ${new Date(startDate).toLocaleDateString()}`}
                                    {(startDate && endDate) && ' - '}
                                    {endDate && `To: ${new Date(endDate).toLocaleDateString()}`}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                                <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider mb-1">Total Sales</p>
                                <h4 className="text-3xl font-extrabold">{filteredSales.length}</h4>
                                <p className="text-xs text-blue-100 mt-1">Transactions</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                                <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider mb-1">Total Revenue</p>
                                <h4 className="text-3xl font-extrabold">LKR {totalRevenue.toLocaleString()}</h4>
                                <p className="text-xs text-blue-100 mt-1">Total earnings</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                                <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider mb-1">Total Profit</p>
                                <h4 className="text-3xl font-extrabold">LKR {(() => {
                                    const filteredProfit = filteredSales.reduce((sum, sale) => {
                                        const saleProfit = sale.items?.reduce((itemSum, item) => {
                                            const itemProfit = (item.unitPrice - (item.purchasePrice || item.unitPrice * 0.7)) * item.quantity;
                                            return itemSum + itemProfit;
                                        }, 0) || 0;
                                        return sum + saleProfit;
                                    }, 0);
                                    return filteredProfit.toLocaleString();
                                })()}</h4>
                                <p className="text-xs text-blue-100 mt-1">Net earnings</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sales Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th onClick={() => handleSort('date')} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none">
                                        <div className="flex items-center gap-1">Date <ArrowUpDown size={14} /></div>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Invoice #</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Customer</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Items</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Discount</th>
                                    <th onClick={() => handleSort('totalAmount')} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none text-right">
                                        <div className="flex items-center justify-end gap-1">Total <ArrowUpDown size={14} /></div>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Cashier</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Loader2 size={48} className="text-blue-500 animate-spin" />
                                                <p className="text-gray-500 font-medium text-lg">Loading sales data...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredSales.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <Filter className="text-gray-400" size={32} />
                                                </div>
                                                <div>
                                                    <p className="text-gray-600 font-bold text-lg">No records found</p>
                                                    <p className="text-gray-500 text-sm mt-1">Try adjusting your search or date filters.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSales.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-blue-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{new Date(sale.date).toLocaleDateString()}</div>
                                                <div className="text-xs text-gray-500 font-mono">{new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-sm text-gray-900 font-bold">{sale.invoiceNumber || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-gray-100 rounded-full text-gray-500 group-hover:bg-white group-hover:text-blue-500 transition-colors">
                                                        <User size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 text-sm">{sale.customerName}</div>
                                                        <div className="text-xs text-gray-500 flex flex-col">
                                                            <span>{sale.customerPhone}</span>
                                                            <span className="font-mono text-[10px] bg-gray-100 px-1 rounded w-fit mt-0.5">ID: {sale.customerId}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    {sale.items.map((item, idx) => (
                                                        <div key={idx} className="text-sm border-b border-gray-100 pb-2 last:border-b-0">
                                                            <div className="flex justify-between items-center gap-4">
                                                                <span className="text-gray-700">{item.brand} {item.model}</span>
                                                                <span className="text-xs font-bold text-gray-400">x{item.quantity}</span>
                                                            </div>
                                                            {item.warrantyExpiryDate && (
                                                                <div className="text-xs mt-1">
                                                                    <span className={`px-2 py-0.5 rounded font-medium ${new Date(item.warrantyExpiryDate) > new Date() ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                                        {new Date(item.warrantyExpiryDate) > new Date() ? '✓' : '✗'} Warranty: {new Date(item.warrantyExpiryDate).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <div className="text-xs text-gray-400 pt-1 border-t border-dashed border-gray-200 mt-1">
                                                        {sale.items.length} items total
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {sale.discount > 0 ? (
                                                    <span className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-bold">
                                                        - {sale.discount.toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="font-extrabold text-gray-900 text-lg">
                                                    {sale.totalAmount.toLocaleString()}
                                                </div>
                                                <div className="text-[10px] text-gray-400 uppercase font-bold">LKR</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block">
                                                    {sale.cashierName || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => setPrintingSale(sale)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                                                    title="View Receipt"
                                                >
                                                    <Eye size={16} /> View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Print Bill Component */}
            {printingSale && (
                <PrintableBill
                    saleData={printingSale}
                    showPreview={true}
                    onClose={() => setPrintingSale(null)}
                />
            )}
        </div>
    );
};

export default Sales;
