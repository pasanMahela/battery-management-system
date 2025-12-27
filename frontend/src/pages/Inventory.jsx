import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Dialog from '../components/Dialog';
import { Plus, Edit2, Trash2, X, Package, Loader2 } from 'lucide-react';
import { API_ENDPOINTS } from '../constants/constants';

const Inventory = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [batteries, setBatteries] = useState([]);
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
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchBatteries();

        // Check for filter query parameter
        const params = new URLSearchParams(window.location.search);
        const filterParam = params.get('filter');
        if (filterParam === 'expiring') {
            setFilterExpiry('expiring');
            setShowAdvancedFilters(true);
        }
    }, []);

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
                shelfLifeMonths: battery.shelfLifeMonths || 12
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
                warrantyPeriodMonths: '12'
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
                (battery.barcode && battery.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
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

        // Expiry filter
        if (filterExpiry !== 'all') {
            filtered = filtered.filter(battery => {
                const purchaseDate = new Date(battery.purchaseDate);
                const expiryDate = new Date(purchaseDate);
                expiryDate.setMonth(expiryDate.getMonth() + (battery.shelfLifeMonths || 12));
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Package className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    Battery Inventory
                                </h1>
                                <p className="text-gray-600 mt-1">Manage your battery stock and products</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setIsNavigating(true);
                                navigate('/inventory/add');
                            }}
                            disabled={isNavigating}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isNavigating ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <Plus size={20} />
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
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
                            <div className="flex justify-between items-center mb-4">
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
                                        placeholder="Search by serial, brand, model, or barcode..."
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
                                </div>
                            )}

                            {/* Results count */}
                            <div className="mt-4 text-sm text-gray-600">
                                Showing <span className="font-bold text-blue-600">{filteredBatteries.length}</span> of <span className="font-bold">{batteries.length}</span> batteries
                            </div>
                        </div>

                        {/* Inventory Table Card */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-blue-500 to-indigo-600">
                                        <th onClick={() => handleSort('serialNumber')} className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-600">
                                            Serial # {sortConfig.key === 'serialNumber' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">Barcode</th>
                                        <th onClick={() => handleSort('brand')} className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-600">
                                            Brand {sortConfig.key === 'brand' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th onClick={() => handleSort('model')} className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-600">
                                            Model {sortConfig.key === 'model' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th onClick={() => handleSort('capacity')} className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-600">
                                            Capacity {sortConfig.key === 'capacity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th onClick={() => handleSort('voltage')} className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-600">
                                            Voltage {sortConfig.key === 'voltage' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th onClick={() => handleSort('sellingPrice')} className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-600">
                                            Price {sortConfig.key === 'sellingPrice' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th onClick={() => handleSort('stockQuantity')} className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-600">
                                            Stock {sortConfig.key === 'stockQuantity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th onClick={() => handleSort('purchaseDate')} className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-600">
                                            Purchase Date {sortConfig.key === 'purchaseDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">Expiry Date</th>
                                        <th className="px-6 py-4 text-right text-sm font-bold text-white uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBatteries.map((battery) => {
                                        // Calculate expiry date
                                        const purchaseDate = new Date(battery.purchaseDate);
                                        const expiryDate = new Date(purchaseDate);
                                        expiryDate.setMonth(expiryDate.getMonth() + (battery.shelfLifeMonths || 12));

                                        // Check if expiring within 1 month
                                        const today = new Date();
                                        const oneMonthFromNow = new Date();
                                        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
                                        const isExpiringSoon = expiryDate <= oneMonthFromNow && expiryDate > today;
                                        const isExpired = expiryDate <= today;

                                        return (
                                            <tr key={battery.id} className={`border-b border-gray-200 transition-colors ${isExpiringSoon || isExpired ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-blue-50'}`}>
                                                <td className="px-4 py-3 text-gray-800">{battery.serialNumber}</td>
                                                <td className="px-4 py-3 text-gray-600 font-mono text-sm">{battery.barcode || '-'}</td>
                                                <td className="px-4 py-3 text-gray-800">{battery.brand}</td>
                                                <td className="px-4 py-3 text-gray-800">{battery.model}</td>
                                                <td className="px-4 py-3 text-gray-800">{battery.capacity}</td>
                                                <td className="px-4 py-3 text-gray-800">{battery.voltage}V</td>
                                                <td className="px-4 py-3 text-gray-800">LKR {battery.sellingPrice}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-sm font-medium ${battery.stockQuantity > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {battery.stockQuantity}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-sm text-gray-700">
                                                        {new Date(battery.purchaseDate).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`text-sm font-medium ${isExpired ? 'text-red-700 font-bold' : isExpiringSoon ? 'text-orange-600 font-bold' : 'text-gray-700'}`}>
                                                            {expiryDate.toLocaleDateString()}
                                                        </span>
                                                        {isExpired && <span className="text-xs text-red-600 font-bold">EXPIRED</span>}
                                                        {isExpiringSoon && !isExpired && <span className="text-xs text-orange-600 font-bold">EXPIRING SOON</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => openModal(battery)}
                                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(battery.id)}
                                                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {showModal && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                                <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            {editingBattery ? 'Edit Battery' : 'Add New Battery'}
                                        </h2>
                                        <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                                            <X size={24} />
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
                                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors shadow-md"
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
        </div>
    );
};

export default Inventory;
