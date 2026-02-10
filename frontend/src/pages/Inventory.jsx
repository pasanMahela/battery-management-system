import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Dialog from '../components/Dialog';
import Toast from '../components/Toast';
import { Plus, Edit2, Trash2, X, Package, Loader2, RotateCcw, Eye, Download } from 'lucide-react';
import { API_ENDPOINTS, BUSINESS_DEFAULTS, APP_CONFIG } from '../constants/constants';
import PageHeader from '../components/PageHeader';

const Inventory = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [batteries, setBatteries] = useState([]);
    const [toast, setToast] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingBattery, setEditingBattery] = useState(null);
    const [formData, setFormData] = useState({
        serialNumber: '',
        barcode: '',
        brand: '',
        model: '',
        capacity: '',
        voltage: '',
        purchasePrice: '',
        sellingPrice: '',
        purchaseDate: '',
        stockQuantity: '',
        warrantyPeriodMonths: '',
        shelfLifeMonths: ''
    });
    const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBrand, setFilterBrand] = useState('all');
    const [filterModel, setFilterModel] = useState('all');
    const [filterCapacity, setFilterCapacity] = useState('all');
    const [filterExpiry, setFilterExpiry] = useState('all'); // all, expired, expiring, valid
    const [filterStatus, setFilterStatus] = useState('all'); // all, inStock, expired, returned, sold
    const [viewingReturn, setViewingReturn] = useState(null);
    const [returns, setReturns] = useState([]);
    const [filterSalesRep, setFilterSalesRep] = useState('all');
    const [filterInvoiceNumber, setFilterInvoiceNumber] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        fetchBatteries();
        fetchReturns();

        // Check for filter query parameter
        const params = new URLSearchParams(window.location.search);
        const filterParam = params.get('filter');
        if (filterParam === 'expiring') {
            setFilterExpiry('expiring');
            setShowAdvancedFilters(true);
        }
    }, []);

    const fetchReturns = async () => {
        try {
            const res = await axios.get(API_ENDPOINTS.RETURN, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setReturns(res.data);
        } catch (err) {
            console.error('Error fetching returns:', err);
        }
    };

    // Helper function to get battery status
    const getBatteryStatus = (battery) => {
        const purchaseDate = new Date(battery.purchaseDate);
        const expiryDate = new Date(purchaseDate);
        expiryDate.setMonth(expiryDate.getMonth() + (battery.shelfLifeMonths || BUSINESS_DEFAULTS.DEFAULT_SHELF_LIFE_MONTHS));
        const today = new Date();
        const isExpired = expiryDate <= today;

        if (battery.isReturned) return 'Returned';
        if (battery.stockQuantity === 0) return 'Sold';
        if (isExpired) return 'Expired';
        return 'In Stock';
    };

    // Helper function to get status badge style
    const getStatusBadgeStyle = (status) => {
        switch (status) {
            case 'In Stock':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'Expired':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'Returned':
                return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Sold':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    // Get return data for a battery
    const getReturnForBattery = (batteryId) => {
        return returns.find(r => r.batteryId === batteryId);
    };

    const fetchBatteries = async () => {
        try {
            setIsLoading(true);
            const res = await axios.get(API_ENDPOINTS.BATTERY, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setBatteries(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                capacity: parseFloat(formData.capacity),
                voltage: parseFloat(formData.voltage),
                purchasePrice: parseFloat(formData.purchasePrice),
                sellingPrice: parseFloat(formData.sellingPrice),
                stockQuantity: parseInt(formData.stockQuantity),
                warrantyPeriodMonths: parseInt(formData.warrantyPeriodMonths)
            };

            if (editingBattery) {
                await axios.put(`${API_ENDPOINTS.BATTERY}/${editingBattery.id}`, payload, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
            } else {
                await axios.post(API_ENDPOINTS.BATTERY, payload, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
            }

            fetchBatteries();
            closeModal();
            setToast({ message: `Battery ${editingBattery ? 'updated' : 'added'} successfully!`, type: 'success' });
        } catch (err) {
            console.error(err);
            setDialog({ isOpen: true, title: 'Error', message: 'Error saving battery. Please try again.', type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        setDialog({
            isOpen: true,
            title: 'Delete Battery',
            message: 'Are you sure you want to delete this battery? This action cannot be undone.',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await axios.delete(`${API_ENDPOINTS.BATTERY}/${id}`, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    });
                    fetchBatteries();
                    setToast({ message: 'Battery deleted successfully!', type: 'success' });
                } catch (err) {
                    console.error(err);
                    setDialog({ isOpen: true, title: 'Error', message: 'Error deleting battery', type: 'error' });
                }
            }
        });
    };

    const openModal = (battery = null) => {
        if (battery) {
            setEditingBattery(battery);
            setFormData({
                serialNumber: battery.serialNumber,
                barcode: battery.barcode || '',
                brand: battery.brand,
                model: battery.model,
                capacity: battery.capacity,
                voltage: battery.voltage,
                purchasePrice: battery.purchasePrice,
                sellingPrice: battery.sellingPrice,
                purchaseDate: battery.purchaseDate.split('T')[0],
                stockQuantity: battery.stockQuantity,
                warrantyPeriodMonths: battery.warrantyPeriodMonths,
                shelfLifeMonths: battery.shelfLifeMonths || BUSINESS_DEFAULTS.DEFAULT_SHELF_LIFE_MONTHS
            });
        } else {
            setEditingBattery(null);
            setFormData({
                serialNumber: '',
                barcode: '',
                brand: '',
                model: '',
                capacity: '',
                voltage: '',
                purchasePrice: '',
                sellingPrice: '',
                purchaseDate: new Date().toISOString().split('T')[0],
                stockQuantity: '',
                warrantyPeriodMonths: String(BUSINESS_DEFAULTS.DEFAULT_WARRANTY_MONTHS)
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingBattery(null);
    };

    // Filter and sort batteries
    const getFilteredAndSortedBatteries = () => {
        let filtered = [...batteries];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(battery =>
                battery.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                battery.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                battery.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (battery.barcode && battery.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (battery.salesRep && battery.salesRep.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (battery.invoiceNumber && battery.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Brand filter
        if (filterBrand !== 'all') {
            filtered = filtered.filter(b => b.brand === filterBrand);
        }

        // Model filter
        if (filterModel !== 'all') {
            filtered = filtered.filter(b => b.model === filterModel);
        }

        // Capacity filter
        if (filterCapacity !== 'all') {
            filtered = filtered.filter(b => b.capacity === parseFloat(filterCapacity));
        }

        // Sales Rep filter
        if (filterSalesRep !== 'all') {
            filtered = filtered.filter(b => b.salesRep === filterSalesRep);
        }

        // Invoice Number filter
        if (filterInvoiceNumber) {
            filtered = filtered.filter(b =>
                b.invoiceNumber && b.invoiceNumber.toLowerCase().includes(filterInvoiceNumber.toLowerCase())
            );
        }

        // Expiry filter
        if (filterExpiry !== 'all') {
            filtered = filtered.filter(battery => {
                const purchaseDate = new Date(battery.purchaseDate);
                const expiryDate = new Date(purchaseDate);
                expiryDate.setMonth(expiryDate.getMonth() + (battery.shelfLifeMonths || BUSINESS_DEFAULTS.DEFAULT_SHELF_LIFE_MONTHS));
                const today = new Date();
                const oneMonthFromNow = new Date();
                oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
                const isExpired = expiryDate <= today;
                const isExpiring = expiryDate <= oneMonthFromNow && expiryDate > today;

                if (filterExpiry === 'expired') return isExpired;
                if (filterExpiry === 'expiring') return isExpiring;
                if (filterExpiry === 'valid') return !isExpired && !isExpiring;
                return true;
            });
        }

        // Status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(battery => {
                const status = getBatteryStatus(battery);
                if (filterStatus === 'inStock') return status === 'In Stock';
                if (filterStatus === 'expired') return status === 'Expired';
                if (filterStatus === 'returned') return status === 'Returned';
                if (filterStatus === 'sold') return status === 'Sold';
                return true;
            });
        }

        // Sorting
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                // Handle dates
                if (sortConfig.key === 'purchaseDate') {
                    aVal = new Date(aVal);
                    bVal = new Date(bVal);
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredBatteries = getFilteredAndSortedBatteries();

    // Export inventory to CSV
    const exportInventory = () => {
        setIsExporting(true);
        try {
            const headers = [
                'Serial Number',
                'Barcode',
                'Brand',
                'Model',
                'Capacity (Ah)',
                'Voltage (V)',
                'Purchase Price',
                'Selling Price',
                'Purchase Date',
                'Expiry Date',
                'Stock Quantity',
                'Warranty (Months)',
                'Shelf Life (Months)',
                'Sales Rep',
                'Invoice Number',
                'Status'
            ];

            const rows = filteredBatteries.map(battery => {
                const purchaseDate = new Date(battery.purchaseDate);
                const expiryDate = new Date(purchaseDate);
                expiryDate.setMonth(expiryDate.getMonth() + (battery.shelfLifeMonths || BUSINESS_DEFAULTS.DEFAULT_SHELF_LIFE_MONTHS));
                const status = getBatteryStatus(battery);

                return [
                    battery.serialNumber,
                    battery.barcode || '',
                    battery.brand,
                    battery.model,
                    battery.capacity,
                    battery.voltage,
                    battery.purchasePrice,
                    battery.sellingPrice,
                    purchaseDate.toLocaleDateString(),
                    expiryDate.toLocaleDateString(),
                    battery.stockQuantity,
                    battery.warrantyPeriodMonths,
                    battery.shelfLifeMonths || BUSINESS_DEFAULTS.DEFAULT_SHELF_LIFE_MONTHS,
                    battery.salesRep || '',
                    battery.invoiceNumber || '',
                    status
                ];
            });

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => 
                    typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
                ).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="w-full max-w-[1400px] mx-auto p-2 sm:p-3 space-y-3">
                {/* Header */}
                <PageHeader title="Battery Inventory" />

                {/* Action Bar */}
                <div className="flex items-center justify-between bg-white border border-gray-300 rounded shadow-sm p-3">
                    <div className="text-sm text-gray-600">
                        Manage your battery stock and products
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportInventory}
                            disabled={isExporting || filteredBatteries.length === 0}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-gray-400 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExporting ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Download size={16} />
                            )}
                            Export
                        </button>
                        <button
                            onClick={() => {
                                setIsNavigating(true);
                                navigate('/inventory/add');
                            }}
                            disabled={isNavigating}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] text-white rounded hover:bg-[#1d4ed8] transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isNavigating ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Plus size={16} />
                            )}
                            {isNavigating ? 'Loading...' : 'Add New Battery'}
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-gray-600 font-medium">Loading inventory...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Search and Filters */}
                        <div className="bg-white border border-gray-300 rounded shadow-sm p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-bold text-gray-800">Filters</h3>
                                <button
                                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    {showAdvancedFilters ? '- Hide Advanced Filters' : '+ Show Advanced Filters'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Search */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                                    <input
                                        type="text"
                                        placeholder="Search by serial, brand, model, invoice, sales rep..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>

                                {/* Brand Filter */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Brand</label>
                                    <select
                                        value={filterBrand}
                                        onChange={(e) => setFilterBrand(e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all"
                                    >
                                        <option value="all">All Brands</option>
                                        {[...new Set(batteries.map(b => b.brand))].map(brand => (
                                            <option key={brand} value={brand}>{brand}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Model Filter */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Model</label>
                                    <select
                                        value={filterModel}
                                        onChange={(e) => setFilterModel(e.target.value)}
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all"
                                    >
                                        <option value="all">All Models</option>
                                        {[...new Set(batteries.map(b => b.model))].map(model => (
                                            <option key={model} value={model}>{model}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Advanced Filters */}
                            {showAdvancedFilters && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                                    {/* Capacity Filter */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Capacity (Ah)</label>
                                        <select
                                            value={filterCapacity}
                                            onChange={(e) => setFilterCapacity(e.target.value)}
                                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all"
                                        >
                                            <option value="all">All Capacities</option>
                                            {[...new Set(batteries.map(b => b.capacity))].sort((a, b) => a - b).map(capacity => (
                                                <option key={capacity} value={capacity}>{capacity} Ah</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Sales Rep Filter */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Sales Rep</label>
                                        <select
                                            value={filterSalesRep}
                                            onChange={(e) => setFilterSalesRep(e.target.value)}
                                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all"
                                        >
                                            <option value="all">All Sales Reps</option>
                                            {[...new Set(batteries.filter(b => b.salesRep).map(b => b.salesRep))].map(rep => (
                                                <option key={rep} value={rep}>{rep}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Invoice Number Filter */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Invoice Number</label>
                                        <input
                                            type="text"
                                            placeholder="Search by invoice..."
                                            value={filterInvoiceNumber}
                                            onChange={(e) => setFilterInvoiceNumber(e.target.value)}
                                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>

                                    {/* Expiry Filter */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Status</label>
                                        <select
                                            value={filterExpiry}
                                            onChange={(e) => setFilterExpiry(e.target.value)}
                                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all"
                                        >
                                            <option value="all">All Items</option>
                                            <option value="expired">Expired</option>
                                            <option value="expiring">Expiring Soon</option>
                                            <option value="valid">Valid</option>
                                        </select>
                                    </div>

                                    {/* Battery Status Filter */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Battery Status</label>
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all"
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="inStock">In Stock</option>
                                            <option value="expired">Expired</option>
                                            <option value="returned">Returned</option>
                                            <option value="sold">Sold</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Results count */}
                            <div className="mt-4 text-sm text-gray-600">
                                Showing <span className="font-bold text-blue-600">{filteredBatteries.length}</span> of <span className="font-bold">{batteries.length}</span> batteries
                            </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {filteredBatteries.map((battery) => {
                                const purchaseDate = new Date(battery.purchaseDate);
                                const expiryDate = new Date(purchaseDate);
                                expiryDate.setMonth(expiryDate.getMonth() + (battery.shelfLifeMonths || BUSINESS_DEFAULTS.DEFAULT_SHELF_LIFE_MONTHS));
                                const today = new Date();
                                const oneMonthFromNow = new Date();
                                oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
                                const isExpiringSoon = expiryDate <= oneMonthFromNow && expiryDate > today;
                                const isExpired = expiryDate <= today;
                                const status = getBatteryStatus(battery);

                                return (
                                    <div
                                        key={battery.id}
                                        className={`bg-white rounded shadow-sm border p-4 ${isExpiringSoon || isExpired ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                            }`}
                                    >
                                        {/* Header with Serial & Status */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">Serial #</p>
                                                <p className="font-bold text-gray-800">{battery.serialNumber}</p>
                                                {battery.barcode && (
                                                    <p className="text-xs text-gray-500 font-mono">{battery.barcode}</p>
                                                )}
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusBadgeStyle(status)}`}>
                                                {status}
                                            </span>
                                        </div>

                                        {/* Brand & Model */}
                                        <div className="flex gap-4 mb-3">
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500">Brand</p>
                                                <p className="font-semibold text-gray-800">{battery.brand}</p>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-500">Model</p>
                                                <p className="font-semibold text-gray-800">{battery.model}</p>
                                            </div>
                                        </div>

                                        {/* Purchase, Expiry & Stock */}
                                        <div className="grid grid-cols-3 gap-2 mb-3">
                                            <div>
                                                <p className="text-xs text-gray-500">Purchase</p>
                                                <p className="font-medium text-gray-700 text-sm">{purchaseDate.toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Expiry</p>
                                                <p className={`font-bold text-sm ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-gray-700'}`}>
                                                    {expiryDate.toLocaleDateString()}
                                                </p>
                                                {isExpired && <span className="text-xs text-red-600 font-bold">EXPIRED</span>}
                                                {isExpiringSoon && !isExpired && <span className="text-xs text-orange-600 font-bold">EXPIRING</span>}
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Stock</p>
                                                <p className="font-bold text-gray-800 text-sm">{battery.stockQuantity}</p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                                            {battery.isReturned && (
                                                <button
                                                    onClick={() => setViewingReturn(getReturnForBattery(battery.id))}
                                                    className="flex items-center gap-1 px-3 py-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all text-sm font-medium"
                                                >
                                                    <Eye size={16} /> View Return
                                                </button>
                                            )}
                                            {(() => {
                                                const expDate = new Date(battery.purchaseDate);
                                                expDate.setMonth(expDate.getMonth() + (battery.shelfLifeMonths || BUSINESS_DEFAULTS.DEFAULT_SHELF_LIFE_MONTHS));
                                                const isExp = expDate < new Date();
                                                return isExp && !battery.isReturned && (
                                                    <button
                                                        onClick={() => navigate('/returns', { state: { battery } })}
                                                        className="flex items-center gap-1 px-3 py-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all text-sm font-medium"
                                                    >
                                                        <RotateCcw size={16} /> Return
                                                    </button>
                                                );
                                            })()}
                                            <button
                                                onClick={() => navigate(`/inventory/edit?id=${battery.id}`)}
                                                className="flex items-center gap-1 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all text-sm font-medium"
                                            >
                                                <Edit2 size={16} /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(battery.id)}
                                                className="flex items-center gap-1 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all text-sm font-medium"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Table View with Progressive Column Hiding */}
                        {/* 
                            Column visibility by screen size:
                            - Always visible: Serial#, Brand, Model, Expiry, Status, Actions
                            - Hidden on small (sm): Sales Rep, Invoice#
                            - Hidden on medium (md): Capacity, Voltage, Stock
                            - Hidden on large (lg): Barcode, Purchase Date, Price
                            - All visible on xl+
                        */}
                        {/* Table View */}
                        <div className="hidden md:block bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-[#2563eb] text-white text-left">
                                            <th onClick={() => handleSort('serialNumber')} className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 whitespace-nowrap">
                                            Serial # {sortConfig.key === 'serialNumber' && (sortConfig.direction === 'asc' ? '?' : '?')}
                                        </th>
                                            {/* Hidden below lg */}
                                            <th className="hidden lg:table-cell px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Barcode</th>
                                            {/* ALWAYS VISIBLE */}
                                            <th onClick={() => handleSort('brand')} className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 whitespace-nowrap">
                                            Brand {sortConfig.key === 'brand' && (sortConfig.direction === 'asc' ? '?' : '?')}
                                        </th>
                                            {/* ALWAYS VISIBLE */}
                                            <th onClick={() => handleSort('model')} className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 whitespace-nowrap">
                                            Model {sortConfig.key === 'model' && (sortConfig.direction === 'asc' ? '?' : '?')}
                                        </th>
                                            {/* Hidden below xl */}
                                            <th onClick={() => handleSort('capacity')} className="hidden xl:table-cell px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 whitespace-nowrap">
                                            Capacity {sortConfig.key === 'capacity' && (sortConfig.direction === 'asc' ? '?' : '?')}
                                        </th>
                                            {/* Hidden below xl */}
                                            <th onClick={() => handleSort('voltage')} className="hidden xl:table-cell px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 whitespace-nowrap">
                                            Voltage {sortConfig.key === 'voltage' && (sortConfig.direction === 'asc' ? '?' : '?')}
                                        </th>
                                            {/* Hidden below xl */}
                                            <th onClick={() => handleSort('sellingPrice')} className="hidden xl:table-cell px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 whitespace-nowrap">
                                            Price {sortConfig.key === 'sellingPrice' && (sortConfig.direction === 'asc' ? '?' : '?')}
                                        </th>
                                            {/* Hidden below lg */}
                                            <th onClick={() => handleSort('purchaseDate')} className="hidden lg:table-cell px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-700 whitespace-nowrap">
                                                Purchase {sortConfig.key === 'purchaseDate' && (sortConfig.direction === 'asc' ? '?' : '?')}
                                        </th>
                                            {/* ALWAYS VISIBLE */}
                                            <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Expiry</th>
                                            {/* ALWAYS VISIBLE */}
                                            <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Stock</th>
                                            {/* Hidden below 2xl */}
                                            <th className="hidden 2xl:table-cell px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Sales Rep</th>
                                            {/* Hidden below 2xl */}
                                            <th className="hidden 2xl:table-cell px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Invoice #</th>
                                            {/* ALWAYS VISIBLE */}
                                            <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Status</th>
                                            {/* ALWAYS VISIBLE */}
                                            <th className="px-3 py-2 text-right text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBatteries.map((battery, index) => {
                                        const purchaseDate = new Date(battery.purchaseDate);
                                        const expiryDate = new Date(purchaseDate);
                                        expiryDate.setMonth(expiryDate.getMonth() + (battery.shelfLifeMonths || BUSINESS_DEFAULTS.DEFAULT_SHELF_LIFE_MONTHS));
                                        const today = new Date();
                                        const oneMonthFromNow = new Date();
                                        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
                                        const isExpiringSoon = expiryDate <= oneMonthFromNow && expiryDate > today;
                                        const isExpired = expiryDate <= today;

                                        return (
                                            <tr key={battery.id} className={`border-b border-gray-200 transition-colors ${isExpiringSoon || isExpired ? 'bg-red-50 hover:bg-red-100' : index % 2 === 0 ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-blue-50'}`}>
                                                    {/* ALWAYS VISIBLE */}
                                                    <td className="px-3 py-3 text-gray-800 text-sm font-medium">{battery.serialNumber}</td>
                                                    {/* Hidden below lg */}
                                                    <td className="hidden lg:table-cell px-3 py-3 text-gray-600 font-mono text-xs">{battery.barcode || '-'}</td>
                                                    {/* ALWAYS VISIBLE */}
                                                    <td className="px-3 py-3 text-gray-800 text-sm">{battery.brand}</td>
                                                    {/* ALWAYS VISIBLE */}
                                                    <td className="px-3 py-3 text-gray-800 text-sm">{battery.model}</td>
                                                    {/* Hidden below xl */}
                                                    <td className="hidden xl:table-cell px-3 py-3 text-gray-800 text-sm">{battery.capacity}Ah</td>
                                                    {/* Hidden below xl */}
                                                    <td className="hidden xl:table-cell px-3 py-3 text-gray-800 text-sm">{battery.voltage}V</td>
                                                    {/* Hidden below xl */}
                                                    <td className="hidden xl:table-cell px-3 py-3 text-gray-800 text-sm whitespace-nowrap">{APP_CONFIG.CURRENCY} {battery.sellingPrice?.toLocaleString()}</td>
                                                    {/* Hidden below lg */}
                                                    <td className="hidden lg:table-cell px-3 py-3 text-sm text-gray-700 whitespace-nowrap">
                                                        {new Date(battery.purchaseDate).toLocaleDateString()}
                                                </td>
                                                    {/* ALWAYS VISIBLE */}
                                                    <td className="px-3 py-3">
                                                        <div className="flex flex-col">
                                                            <span className={`text-sm font-medium whitespace-nowrap ${isExpired ? 'text-red-700 font-bold' : isExpiringSoon ? 'text-orange-600 font-bold' : 'text-gray-700'}`}>
                                                            {expiryDate.toLocaleDateString()}
                                                        </span>
                                                        {isExpired && <span className="text-xs text-red-600 font-bold">EXPIRED</span>}
                                                            {isExpiringSoon && !isExpired && <span className="text-xs text-orange-600 font-bold">EXPIRING</span>}
                                                    </div>
                                                </td>
                                                    {/* ALWAYS VISIBLE */}
                                                    <td className="px-3 py-3 text-gray-800 text-sm text-center">{battery.stockQuantity}</td>
                                                    {/* Hidden below 2xl */}
                                                    <td className="hidden 2xl:table-cell px-3 py-3 text-gray-700 text-sm">
                                                    {battery.salesRep || '-'}
                                                </td>
                                                    {/* Hidden below 2xl */}
                                                    <td className="hidden 2xl:table-cell px-3 py-3 text-gray-600 font-mono text-xs">
                                                    {battery.invoiceNumber || '-'}
                                                </td>
                                                    {/* ALWAYS VISIBLE */}
                                                    <td className="px-3 py-3">
                                                        {(() => {
                                                            const status = getBatteryStatus(battery);
                                                            return (
                                                                <span className={`px-2 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${getStatusBadgeStyle(status)}`}>
                                                                    {status}
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    {/* ALWAYS VISIBLE */}
                                                    <td className="px-3 py-3 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            {battery.isReturned && (
                                                                <button
                                                                    onClick={() => setViewingReturn(getReturnForBattery(battery.id))}
                                                                    className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-all"
                                                                    title="View Return Details"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                            )}
                                                            {(() => {
                                                                const expDate = new Date(battery.purchaseDate);
                                                                expDate.setMonth(expDate.getMonth() + (battery.shelfLifeMonths || BUSINESS_DEFAULTS.DEFAULT_SHELF_LIFE_MONTHS));
                                                                const isExp = expDate < new Date();
                                                                return isExp && !battery.isReturned && (
                                                                    <button
                                                                        onClick={() => navigate('/returns', { state: { battery } })}
                                                                        className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-all"
                                                                        title="Return Expired Battery"
                                                                    >
                                                                        <RotateCcw size={16} />
                                                                    </button>
                                                                );
                                                            })()}
                                                        <button
                                                            onClick={() => navigate(`/inventory/edit?id=${battery.id}`)}
                                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                                                            title="Edit"
                                                        >
                                                                <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(battery.id)}
                                                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                                                            title="Delete"
                                                        >
                                                                <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            </div>
                        </div>

                        {showModal && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                                <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-300">
                                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                                        <h2 className="text-xl font-bold text-gray-800">
                                            {editingBattery ? 'Edit Battery' : 'Add New Battery'}
                                        </h2>
                                        <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm mb-1 text-gray-700 font-medium">Serial Number</label>
                                                <input
                                                    type="text"
                                                    value={formData.serialNumber}
                                                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm mb-1 text-gray-700 font-medium">Barcode</label>
                                                <input
                                                    type="text"
                                                    value={formData.barcode}
                                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                    placeholder="Optional"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm mb-1 text-gray-700 font-medium">Brand</label>
                                                <input
                                                    type="text"
                                                    value={formData.brand}
                                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm mb-1 text-gray-700 font-medium">Model</label>
                                                <input
                                                    type="text"
                                                    value={formData.model}
                                                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm mb-1 text-gray-700 font-medium">Capacity (Ah)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={formData.capacity}
                                                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm mb-1 text-gray-700 font-medium">Voltage</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    value={formData.voltage}
                                                    onChange={(e) => setFormData({ ...formData, voltage: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm mb-1 text-gray-700 font-medium">Purchase Price</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.purchasePrice}
                                                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm mb-1 text-gray-700 font-medium">Selling Price</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.sellingPrice}
                                                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm mb-1 text-gray-700 font-medium">Purchase Date</label>
                                                <input
                                                    type="date"
                                                    value={formData.purchaseDate}
                                                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm mb-1 text-gray-700 font-medium">Stock Quantity</label>
                                                <input
                                                    type="number"
                                                    value={formData.stockQuantity}
                                                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm mb-1 text-gray-700 font-medium">Warranty (Months)</label>
                                                <input
                                                    type="number"
                                                    value={formData.warrantyPeriodMonths}
                                                    onChange={(e) => setFormData({ ...formData, warrantyPeriodMonths: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm mb-1 text-gray-700 font-medium">Shelf Life (Months)</label>
                                                <input
                                                    type="number"
                                                    value={formData.shelfLifeMonths}
                                                    onChange={(e) => setFormData({ ...formData, shelfLifeMonths: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                    placeholder="e.g., 6 or 12 months"
                                                    required
                                                />
                                                <p className="text-xs text-gray-500 mt-1">How long can battery be stored before expiring</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
                                            <button
                                                type="button"
                                                onClick={closeModal}
                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-[#2563eb] text-white rounded hover:bg-[#1d4ed8] transition-colors font-bold text-sm"
                                            >
                                                {editingBattery ? 'Update' : 'Create'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Dialog Component */}
                        <Dialog
                            isOpen={dialog.isOpen}
                            onClose={() => setDialog({ ...dialog, isOpen: false })}
                            title={dialog.title}
                            message={dialog.message}
                            type={dialog.type}
                            onConfirm={dialog.onConfirm}
                        />
                    </>
                )}
            </div>

            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* View Return Modal */}
            {viewingReturn && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-300">
                        <div className="sticky top-0 bg-[#2563eb] p-4 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white">Return Details</h2>
                            <button
                                onClick={() => setViewingReturn(null)}
                                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Battery Info */}
                            <div className="bg-gray-50 rounded p-4">
                                <h3 className="font-bold text-lg text-gray-800 mb-3">Battery Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Serial Number</p>
                                        <p className="font-bold text-gray-800">{viewingReturn.serialNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Brand</p>
                                        <p className="font-bold text-gray-800">{viewingReturn.brand}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Model</p>
                                        <p className="font-bold text-gray-800">{viewingReturn.model}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Expiry Date</p>
                                        <p className="font-bold text-red-600">
                                            {new Date(viewingReturn.expiryDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Return Info */}
                            <div className="bg-orange-50 rounded p-4">
                                <h3 className="font-bold text-lg text-gray-800 mb-3">Return Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Return Date</p>
                                        <p className="font-bold text-gray-800">
                                            {new Date(viewingReturn.returnDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Returned By</p>
                                        <p className="font-bold text-gray-800">{viewingReturn.returnedBy}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${viewingReturn.status === 'Completed'
                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                            }`}>
                                            {viewingReturn.status}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Reason</p>
                                        <p className="font-bold text-gray-800">{viewingReturn.reason}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Compensation Info */}
                            <div className={`rounded p-4 ${viewingReturn.compensationType === 'Money' ? 'bg-green-50' : 'bg-blue-50'}`}>
                                <h3 className="font-bold text-lg text-gray-800 mb-3">Compensation Details</h3>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`text-xl font-bold ${viewingReturn.compensationType === 'Money' ? 'text-green-600' : 'text-blue-600'}`}>
                                        {viewingReturn.compensationType}
                                    </span>
                                </div>
                                {viewingReturn.compensationType === 'Money' && (
                                    <div>
                                        <p className="text-sm text-gray-500">Refund Amount</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {APP_CONFIG.CURRENCY} {viewingReturn.moneyAmount?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                )}
                                {viewingReturn.compensationType === 'Replacement' && (
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-500">Replacement Battery Serial Number</p>
                                            <p className="font-bold text-blue-600">{viewingReturn.replacementSerialNumber || 'N/A'}</p>
                                        </div>
                                        {viewingReturn.replacementSalesRep && (
                                            <div>
                                                <p className="text-sm text-gray-500">Sales Rep</p>
                                                <p className="font-bold text-gray-800">{viewingReturn.replacementSalesRep}</p>
                                            </div>
                                        )}
                                        {viewingReturn.replacementInvoiceNumber && (
                                            <div>
                                                <p className="text-sm text-gray-500">Invoice Number</p>
                                                <p className="font-bold text-gray-800">{viewingReturn.replacementInvoiceNumber}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            {viewingReturn.notes && (
                                <div className="bg-gray-50 rounded p-4">
                                    <h3 className="font-bold text-lg text-gray-800 mb-2">Notes</h3>
                                    <p className="text-gray-600">{viewingReturn.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200">
                            <button
                                onClick={() => setViewingReturn(null)}
                                className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Inventory;
