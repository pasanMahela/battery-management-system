import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import PrintableBill from '../components/PrintableBill';
import { Search, Calendar, DollarSign, User, Phone, Package, ArrowUpDown, Filter, Download, FileText, Eye, Loader2, X, BarChart2 } from 'lucide-react';
import { API_ENDPOINTS, APP_CONFIG } from '../constants/constants';
import PageHeader from '../components/PageHeader';

const Sales = () => {
    const { user } = useContext(AuthContext);
    const [sales, setSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [isExporting, setIsExporting] = useState(false);

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

    // Calculate profit (Revenue - Cost) using stored purchasePrice
    const totalProfitToday = periodSales.reduce((sum, sale) => {
        const saleProfit = sale.items?.reduce((itemSum, item) => {
            // Profit = (selling price - purchase price) * quantity
            // purchasePrice is now stored in SaleItem for accurate calculation
            const purchasePrice = item.purchasePrice || 0;
            const itemProfit = (item.unitPrice - purchasePrice) * item.quantity;
            return itemSum + itemProfit;
        }, 0) || 0;
        return sum + saleProfit;
    }, 0);

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    // Export to CSV function
    const exportToCSV = () => {
        setIsExporting(true);
        try {
            // Define CSV headers
            const headers = [
                'Invoice Number',
                'Date',
                'Time',
                'Customer Name',
                'Customer Phone',
                'Customer ID',
                'Items',
                'Subtotal',
                'Discount',
                'Total Amount',
                'Cashier',
                'Profit'
            ];

            // Create CSV rows
            const rows = filteredSales.map(sale => {
                const itemsList = sale.items.map(item => 
                    `${item.brand} ${item.model} x${item.quantity}`
                ).join('; ');
                
                const subtotal = sale.items.reduce((sum, item) => 
                    sum + (item.unitPrice * item.quantity), 0
                );
                
                const profit = sale.items.reduce((sum, item) => {
                    const purchasePrice = item.purchasePrice || 0;
                    return sum + ((item.unitPrice - purchasePrice) * item.quantity);
                }, 0);

                return [
                    sale.invoiceNumber || 'N/A',
                    new Date(sale.date).toLocaleDateString(),
                    new Date(sale.date).toLocaleTimeString(),
                    `"${sale.customerName}"`,
                    sale.customerPhone,
                    sale.customerId || '',
                    `"${itemsList}"`,
                    subtotal.toFixed(2),
                    sale.discount.toFixed(2),
                    sale.totalAmount.toFixed(2),
                    sale.cashierName || 'Unknown',
                    profit.toFixed(2)
                ];
            });

            // Combine headers and rows
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `sales_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            // Handle export error silently in production
            if (process.env.NODE_ENV === 'development') {
                console.error('Export error:', error);
            }
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="w-full max-w-[1400px] mx-auto p-2 sm:p-3 space-y-3">

                {/* Page Header */}
                <PageHeader title="Sales History" />

                {/* Action Bar */}
                <div className="flex items-center justify-between bg-white border border-gray-300 rounded shadow-sm p-3">
                    <div className="text-sm text-gray-600">Track and manage your transaction records</div>
                    <button 
                        onClick={exportToCSV}
                        disabled={isExporting || filteredSales.length === 0}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-gray-400 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isExporting ? (
                            <><Loader2 size={16} className="animate-spin" /> Exporting...</>
                        ) : (
                            <><Download size={16} /> Export CSV</>
                        )}
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="bg-white border border-gray-300 rounded shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold text-gray-800">Sales Overview</h2>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setTimePeriod('today')}
                                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${timePeriod === 'today'
                                    ? 'bg-[#2563eb] text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setTimePeriod('week')}
                                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${timePeriod === 'week'
                                    ? 'bg-[#2563eb] text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                This Week
                            </button>
                            <button
                                onClick={() => setTimePeriod('month')}
                                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${timePeriod === 'month'
                                    ? 'bg-[#2563eb] text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                This Month
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-blue-50 p-4 rounded border border-blue-200 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                                    Total Sales {timePeriod === 'today' ? 'Today' : timePeriod === 'week' ? 'This Week' : 'This Month'}
                                </p>
                                <h3 className="text-2xl font-extrabold text-blue-900 mt-1">{totalSalesToday}</h3>
                                <p className="text-xs text-blue-600">Transactions</p>
                            </div>
                            <div className="p-3 bg-[#2563eb] text-white rounded">
                                <FileText size={20} />
                            </div>
                        </div>

                        <div className="bg-green-50 p-4 rounded border border-green-200 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-green-700 uppercase tracking-wider">
                                    Total Revenue {timePeriod === 'today' ? 'Today' : timePeriod === 'week' ? 'This Week' : 'This Month'}
                                </p>
                                <h3 className="text-2xl font-extrabold text-green-900 mt-1">{APP_CONFIG.CURRENCY} {totalRevenueToday.toLocaleString()}</h3>
                                <p className="text-xs text-green-600">Total earnings</p>
                            </div>
                            <div className="p-3 bg-green-600 text-white rounded">
                                <DollarSign size={20} />
                            </div>
                        </div>

                        <div className="bg-purple-50 p-4 rounded border border-purple-200 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                                    Total Profit {timePeriod === 'today' ? 'Today' : timePeriod === 'week' ? 'This Week' : 'This Month'}
                                </p>
                                <h3 className="text-2xl font-extrabold text-purple-900 mt-1">{APP_CONFIG.CURRENCY} {totalProfitToday.toLocaleString()}</h3>
                                <p className="text-xs text-purple-600">Net earnings</p>
                            </div>
                            <div className="p-3 bg-purple-600 text-white rounded">
                                <Package size={20} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white border border-gray-300 rounded shadow-sm p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-5 relative">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Search</label>
                            <Search className="absolute left-3 top-[30px] text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search customer, phone, battery brand, model..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:border-[#2563eb] outline-none transition-all text-sm"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">From Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-[#2563eb] outline-none transition-all text-sm"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">To Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-[#2563eb] outline-none transition-all text-sm"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setStartDate('');
                                    setEndDate('');
                                }}
                                className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium transition-colors flex items-center justify-center"
                                title="Clear Filters"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filtered Results Summary */}
                {(searchTerm || startDate || endDate) && (
                    <div className="bg-[#2563eb] rounded shadow-sm p-4 text-white">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="text-sm font-bold">Filtered Results</h3>
                                <p className="text-xs text-blue-100">
                                    {searchTerm && `Search: "${searchTerm}"`}
                                    {(searchTerm && (startDate || endDate)) && ' • '}
                                    {startDate && `From: ${new Date(startDate).toLocaleDateString()}`}
                                    {(startDate && endDate) && ' - '}
                                    {endDate && `To: ${new Date(endDate).toLocaleDateString()}`}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-white/10 rounded p-3 border border-white/20">
                                <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">Total Sales</p>
                                <h4 className="text-2xl font-extrabold">{filteredSales.length}</h4>
                                <p className="text-xs text-blue-100">Transactions</p>
                            </div>
                            <div className="bg-white/10 rounded p-3 border border-white/20">
                                <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">Total Revenue</p>
                                <h4 className="text-2xl font-extrabold">{APP_CONFIG.CURRENCY} {totalRevenue.toLocaleString()}</h4>
                                <p className="text-xs text-blue-100">Total earnings</p>
                            </div>
                            <div className="bg-white/10 rounded p-3 border border-white/20">
                                <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">Total Profit</p>
                                <h4 className="text-2xl font-extrabold">{APP_CONFIG.CURRENCY} {(() => {
                                    const filteredProfit = filteredSales.reduce((sum, sale) => {
                                        const saleProfit = sale.items?.reduce((itemSum, item) => {
                                            const purchasePrice = item.purchasePrice || 0;
                                            const itemProfit = (item.unitPrice - purchasePrice) * item.quantity;
                                            return itemSum + itemProfit;
                                        }, 0) || 0;
                                        return sum + saleProfit;
                                    }, 0);
                                    return filteredProfit.toLocaleString();
                                })()}</h4>
                                <p className="text-xs text-blue-100">Net earnings</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sales Table */}
                <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-[#2563eb] text-white text-left">
                                    <th onClick={() => handleSort('date')} className="px-3 py-2 text-xs font-bold text-white uppercase cursor-pointer hover:bg-blue-700 select-none">
                                        <div className="flex items-center gap-1">Date <ArrowUpDown size={12} /></div>
                                    </th>
                                    <th className="px-3 py-2 text-xs font-bold text-white uppercase">Invoice #</th>
                                    <th className="px-3 py-2 text-xs font-bold text-white uppercase">Customer</th>
                                    <th className="px-3 py-2 text-xs font-bold text-white uppercase">Items</th>
                                    <th className="px-3 py-2 text-xs font-bold text-white uppercase text-right">Discount</th>
                                    <th onClick={() => handleSort('totalAmount')} className="px-3 py-2 text-xs font-bold text-white uppercase cursor-pointer hover:bg-blue-700 select-none text-right">
                                        <div className="flex items-center justify-end gap-1">Total <ArrowUpDown size={12} /></div>
                                    </th>
                                    <th className="px-3 py-2 text-xs font-bold text-white uppercase text-right">Cashier</th>
                                    <th className="px-3 py-2 text-xs font-bold text-white uppercase text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="8" className="px-3 py-10 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Loader2 size={32} className="text-[#2563eb] animate-spin" />
                                                <p className="text-gray-500 font-medium text-sm">Loading sales data...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredSales.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-3 py-10 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Filter className="text-gray-400" size={24} />
                                                <p className="text-gray-600 font-bold text-sm">No records found</p>
                                                <p className="text-gray-400 text-xs">Try adjusting your search or date filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSales.map((sale, index) => (
                                        <tr key={sale.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 transition-colors border-b border-gray-200`}>
                                            <td className="px-3 py-2">
                                                <div className="font-bold text-gray-900 text-sm">{new Date(sale.date).toLocaleDateString()}</div>
                                                <div className="text-xs text-gray-500 font-mono">{new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="font-mono text-sm text-gray-900 font-bold">{sale.invoiceNumber || 'N/A'}</div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm">{sale.customerName}</div>
                                                    <div className="text-xs text-gray-500">
                                                        <span>{sale.customerPhone}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="space-y-1">
                                                    {sale.items.map((item, idx) => (
                                                        <div key={idx} className="text-xs border-b border-gray-100 pb-1 last:border-b-0">
                                                            <div className="flex justify-between items-center gap-2">
                                                                <span className="text-gray-700">{item.brand} {item.model}</span>
                                                                <span className="text-xs font-bold text-gray-400">x{item.quantity}</span>
                                                            </div>
                                                            {item.warrantyExpiryDate && (
                                                                <div className="text-[10px] mt-0.5">
                                                                    <span className={`px-1.5 py-0.5 rounded font-medium ${new Date(item.warrantyExpiryDate) > new Date() ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                                        {new Date(item.warrantyExpiryDate) > new Date() ? '✓' : '✗'} Warranty: {new Date(item.warrantyExpiryDate).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <div className="text-[10px] text-gray-400 pt-0.5 border-t border-dashed border-gray-200">
                                                        {sale.items.length} item(s)
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                {sale.discount > 0 ? (
                                                    <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-xs font-bold">
                                                        - {sale.discount.toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <div className="font-extrabold text-gray-900 text-sm">
                                                    {sale.totalAmount.toLocaleString()}
                                                </div>
                                                <div className="text-[10px] text-gray-400 uppercase font-bold">{APP_CONFIG.CURRENCY}</div>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <span className="text-xs font-medium text-gray-600">
                                                    {sale.cashierName || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <button
                                                    onClick={() => setPrintingSale(sale)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-[#2563eb] text-white rounded hover:bg-[#1d4ed8] transition-colors font-bold text-xs"
                                                    title="View Receipt"
                                                >
                                                    <Eye size={14} /> View
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
