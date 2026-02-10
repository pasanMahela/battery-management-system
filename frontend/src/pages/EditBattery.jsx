import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Toast from '../components/Toast';
import Dialog from '../components/Dialog';
import { ArrowLeft, Save, Search, Loader2, ScanBarcode, Focus } from 'lucide-react';
import { API_ENDPOINTS } from '../constants/constants';
import ScannerContext from '../context/ScannerContext';
import PageHeader from '../components/PageHeader';

const EditBattery = () => {
    const { user } = useContext(AuthContext);
    const { setScanCallback, status: scannerStatus } = useContext(ScannerContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [toast, setToast] = useState(null);
    const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });
    const searchRef = useRef(null);
    const barcodeRef = useRef(null);
    const [scanMode, setScanMode] = useState(false);
    const [searchScanMode, setSearchScanMode] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [batteryFound, setBatteryFound] = useState(false);
    const [batteryId, setBatteryId] = useState(null);

    // All batteries for search
    const [allBatteries, setAllBatteries] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);

    // Form state
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
        shelfLifeMonths: '',
        salesRep: '',
        invoiceNumber: ''
    });

    const [existingBatteries, setExistingBatteries] = useState([]);
    const [showBrandDropdown, setShowBrandDropdown] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const activateSearchScanMode = () => {
        setSearchScanMode(true);
        setSearchQuery('');
        searchRef.current?.focus();
        searchRef.current?.select();
    };

    // Register scan callback for phone scanner
    useEffect(() => {
        if (scannerStatus === 'connected') {
            setScanCallback((barcode) => {
                if (batteryFound) {
                    setFormData(prev => ({ ...prev, barcode }));
                } else {
                    setSearchQuery(barcode);
                    handleSearch(barcode);
                }
            });
        }
    }, [scannerStatus, setScanCallback, batteryFound]);

    // Fetch all batteries for search
    useEffect(() => {
        const fetchBatteries = async () => {
            try {
                const res = await axios.get(API_ENDPOINTS.BATTERY, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setAllBatteries(res.data);
                setExistingBatteries(res.data);
            } catch (err) {
                console.error('Error fetching batteries:', err);
            }
        };
        fetchBatteries();
    }, [user.token]);

    // Auto-load battery if id is in URL params
    useEffect(() => {
        const id = searchParams.get('id');
        if (id && allBatteries.length > 0) {
            const battery = allBatteries.find(b => b.id === id);
            if (battery) {
                loadBattery(battery);
            }
        }
    }, [searchParams, allBatteries]);

    // Filter search results as user types
    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            const query = searchQuery.toLowerCase();
            const results = allBatteries.filter(b =>
                b.serialNumber?.toLowerCase().includes(query) ||
                b.barcode?.toLowerCase().includes(query) ||
                b.brand?.toLowerCase().includes(query) ||
                b.model?.toLowerCase().includes(query) ||
                `${b.brand} ${b.model}`.toLowerCase().includes(query)
            ).slice(0, 10);
            setSearchResults(results);
            setShowSearchDropdown(results.length > 0);
        } else {
            setSearchResults([]);
            setShowSearchDropdown(false);
        }
    }, [searchQuery, allBatteries]);

    const loadBattery = (battery) => {
        setBatteryId(battery.id);
        setBatteryFound(true);
        setShowSearchDropdown(false);
        setFormData({
            serialNumber: battery.serialNumber || '',
            barcode: battery.barcode || '',
            brand: battery.brand || '',
            model: battery.model || '',
            capacity: battery.capacity?.toString() || '',
            voltage: battery.voltage?.toString() || '',
            purchasePrice: battery.purchasePrice?.toString() || '',
            sellingPrice: battery.sellingPrice?.toString() || '',
            purchaseDate: battery.purchaseDate ? battery.purchaseDate.split('T')[0] : '',
            stockQuantity: battery.stockQuantity?.toString() || '',
            warrantyPeriodMonths: battery.warrantyPeriodMonths?.toString() || '12',
            shelfLifeMonths: battery.shelfLifeMonths?.toString() || '24',
            salesRep: battery.salesRep || '',
            invoiceNumber: battery.invoiceNumber || ''
        });
        setSearchQuery(battery.serialNumber || '');
    };

    const handleSearch = (query = searchQuery) => {
        if (!query.trim()) {
            setToast({ type: 'error', message: 'Please enter a serial number, barcode, or battery name' });
            return;
        }

        setIsSearching(true);
        const q = query.toLowerCase();
        const found = allBatteries.find(b =>
            b.serialNumber?.toLowerCase() === q ||
            b.barcode?.toLowerCase() === q
        );

        if (found) {
            loadBattery(found);
        } else {
            setBatteryFound(false);
            setToast({ type: 'error', message: `No battery found matching "${query}"` });
        }
        setIsSearching(false);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setBatteryFound(false);
        setBatteryId(null);
        setFormData({
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
            shelfLifeMonths: '',
            salesRep: '',
            invoiceNumber: ''
        });
        searchRef.current?.focus();
    };

    // Autocomplete helpers
    const uniqueBrands = [...new Set(existingBatteries.map(b => b.brand))];
    const uniqueModels = [...new Set(existingBatteries.map(b => b.model))];
    const filteredBrands = uniqueBrands.filter(brand =>
        brand.toLowerCase().includes(formData.brand.toLowerCase())
    );
    const filteredModels = uniqueModels.filter(model =>
        model.toLowerCase().includes(formData.model.toLowerCase())
    );

    // Barcode scanner support
    const handleBarcodeKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            setScanMode(false);
        }
    };

    const activateScanMode = () => {
        setScanMode(true);
        barcodeRef.current?.focus();
        barcodeRef.current?.select();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting || !batteryId) return;

        try {
            setIsSubmitting(true);
            const payload = {
                ...formData,
                capacity: parseFloat(formData.capacity) || 0,
                voltage: parseFloat(formData.voltage) || 12,
                purchasePrice: parseFloat(formData.purchasePrice) || 0,
                sellingPrice: parseFloat(formData.sellingPrice) || 0,
                purchaseDate: formData.purchaseDate || new Date().toISOString().split('T')[0],
                stockQuantity: parseInt(formData.stockQuantity) || 0,
                warrantyPeriodMonths: parseInt(formData.warrantyPeriodMonths) || 12,
                shelfLifeMonths: parseInt(formData.shelfLifeMonths) || 24
            };

            await axios.put(`${API_ENDPOINTS.BATTERY}/${batteryId}`, payload, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            const updatedSerial = formData.serialNumber;
            setToast({ type: 'success', message: `Battery "${updatedSerial}" updated successfully!` });

            // Clear form and search
            clearSearch();

            // Refresh batteries list
            const res = await axios.get(API_ENDPOINTS.BATTERY, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setAllBatteries(res.data);
            setExistingBatteries(res.data);
        } catch (error) {
            console.error('Error updating battery:', error);
            if (error.response?.status === 409) {
                const errorData = error.response.data;
                setToast({
                    type: 'error',
                    message: `Duplicate Serial Number! "${errorData.serialNumber}" already exists in another battery.`
                });
            } else {
                setToast({ type: 'error', message: error.response?.data?.message || 'Error updating battery' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="w-full max-w-[1400px] mx-auto p-2 sm:p-3 space-y-3">
                {/* Header */}
                <PageHeader title="Edit Battery" />

                {/* Back Button */}
                <div className="flex items-center justify-between bg-white border border-gray-300 rounded shadow-sm p-3">
                    <button
                        onClick={() => navigate('/inventory/view')}
                        className="flex items-center gap-1.5 text-gray-600 hover:text-[#2563eb] font-bold text-sm transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to Inventory
                    </button>
                    <div className="text-sm text-gray-500">Search for a battery to edit its details</div>
                </div>

                {/* Search Section */}
                <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
                    <div className="bg-[#2563eb] px-4 py-3">
                        <h2 className="text-base font-bold text-white">Search Battery</h2>
                    </div>
                    <div className="p-4">
                        <div className="flex gap-2 relative">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    ref={searchRef}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            setShowSearchDropdown(false);
                                            setSearchScanMode(false);
                                            handleSearch();
                                        }
                                    }}
                                    onFocus={() => {
                                        if (searchQuery.trim()) setShowSearchDropdown(searchResults.length > 0);
                                    }}
                                    onBlur={() => {
                                        setTimeout(() => setShowSearchDropdown(false), 200);
                                        setSearchScanMode(false);
                                    }}
                                    className={`w-full px-3 py-2 border rounded outline-none transition-all text-sm ${
                                        searchScanMode
                                            ? 'bg-green-50 border-green-400 ring-1 ring-green-200'
                                            : 'bg-gray-50 border-gray-300 focus:border-[#2563eb] focus:bg-white'
                                    }`}
                                    placeholder={searchScanMode ? 'Scan barcode now...' : 'Enter serial number, barcode, brand or model...'}
                                    autoFocus
                                />
                                {/* Search Dropdown */}
                                {showSearchDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded shadow-lg border border-gray-200 max-h-64 overflow-y-auto z-20">
                                        {searchResults.map((battery) => (
                                            <div
                                                key={battery.id}
                                                onClick={() => loadBattery(battery)}
                                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <span className="font-bold text-sm text-gray-800">{battery.serialNumber}</span>
                                                        <span className="text-gray-400 mx-2">|</span>
                                                        <span className="text-sm text-gray-600">{battery.brand} {battery.model}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-400">{battery.barcode}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={activateSearchScanMode}
                                className={`px-3 py-2 rounded font-medium transition-all flex items-center gap-1 text-sm ${
                                    searchScanMode
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-[#2563eb] border border-gray-300'
                                }`}
                                title="Click to scan barcode"
                            >
                                <ScanBarcode size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowSearchDropdown(false); handleSearch(); }}
                                disabled={isSearching}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] text-white rounded hover:bg-[#1d4ed8] transition-colors text-sm font-bold disabled:opacity-50"
                            >
                                {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                Search
                            </button>
                            {batteryFound && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="px-4 py-2 border-2 border-gray-400 text-gray-700 rounded hover:bg-gray-50 font-bold text-sm transition-colors"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        {batteryFound && (
                            <div className="mt-2 text-sm text-green-600 font-medium">
                                ✓ Battery found — edit details below
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Form - Always visible */}
                    <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
                        <div className="bg-[#2563eb] px-4 py-3">
                            <h2 className="text-base font-bold text-white">Battery Information</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Serial Number */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Serial Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.serialNumber}
                                        readOnly
                                        className="w-full px-3 py-2 bg-gray-200 border border-gray-300 rounded text-sm text-gray-600 cursor-not-allowed"
                                    />
                                </div>

                                {/* Barcode */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Barcode
                                        {scanMode && (
                                            <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full animate-pulse">
                                                <Focus size={12} /> Ready to scan
                                            </span>
                                        )}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            ref={barcodeRef}
                                            value={formData.barcode}
                                            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                            onKeyDown={handleBarcodeKeyDown}
                                            onFocus={() => setScanMode(true)}
                                            onBlur={() => setScanMode(false)}
                                            className={`flex-1 px-3 py-2 border rounded focus:bg-white outline-none transition-all text-sm ${
                                                scanMode
                                                    ? 'bg-green-50 border-green-400 ring-1 ring-green-200'
                                                    : 'bg-gray-50 border-gray-300 focus:border-[#2563eb]'
                                            }`}
                                            placeholder={scanMode ? 'Scan barcode now...' : 'Click scan or type barcode'}
                                        />
                                        <button
                                            type="button"
                                            onClick={activateScanMode}
                                            className={`px-3 py-2 rounded font-medium transition-all flex items-center gap-1 text-sm ${
                                                scanMode
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-[#2563eb] border border-gray-300'
                                            }`}
                                            title="Click to activate barcode scanner"
                                        >
                                            <ScanBarcode size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Brand with Autocomplete */}
                                <div className="relative">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Brand <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.brand}
                                        onChange={(e) => {
                                            setFormData({ ...formData, brand: e.target.value });
                                            setShowBrandDropdown(true);
                                        }}
                                        onFocus={() => setShowBrandDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowBrandDropdown(false), 200)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded focus:border-[#2563eb] focus:bg-white outline-none transition-all text-sm"
                                        required
                                        placeholder="Type or select brand"
                                    />
                                    {showBrandDropdown && filteredBrands.length > 0 && formData.brand && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded shadow-lg border border-gray-200 max-h-48 overflow-y-auto z-10">
                                            {filteredBrands.map((brand, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => {
                                                        setFormData({ ...formData, brand });
                                                        setShowBrandDropdown(false);
                                                    }}
                                                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700"
                                                >
                                                    {brand}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Model with Autocomplete */}
                                <div className="relative">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Model <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.model}
                                        onChange={(e) => {
                                            setFormData({ ...formData, model: e.target.value });
                                            setShowModelDropdown(true);
                                        }}
                                        onFocus={() => setShowModelDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowModelDropdown(false), 200)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded focus:border-[#2563eb] focus:bg-white outline-none transition-all text-sm"
                                        required
                                        placeholder="Type or select model"
                                    />
                                    {showModelDropdown && filteredModels.length > 0 && formData.model && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded shadow-lg border border-gray-200 max-h-48 overflow-y-auto z-10">
                                            {filteredModels.map((model, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => {
                                                        setFormData({ ...formData, model });
                                                        setShowModelDropdown(false);
                                                    }}
                                                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700"
                                                >
                                                    {model}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Capacity */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Capacity (Ah) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded focus:border-[#2563eb] focus:bg-white outline-none transition-all text-sm"
                                        required
                                    />
                                </div>

                                {/* Voltage */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Voltage (V) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.voltage}
                                        onChange={(e) => setFormData({ ...formData, voltage: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded focus:border-[#2563eb] focus:bg-white outline-none transition-all text-sm"
                                        placeholder="e.g., 12"
                                        required
                                    />
                                </div>

                                {/* Purchase Price */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Purchase Price (LKR) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.purchasePrice}
                                        onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded focus:border-[#2563eb] focus:bg-white outline-none transition-all text-sm"
                                        required
                                    />
                                </div>

                                {/* Selling Price */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Selling Price (LKR) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.sellingPrice}
                                        onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded focus:border-[#2563eb] focus:bg-white outline-none transition-all text-sm"
                                        required
                                    />
                                </div>

                                {/* Purchase Date */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Purchase Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.purchaseDate}
                                        onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded focus:border-[#2563eb] focus:bg-white outline-none transition-all text-sm"
                                        required
                                    />
                                </div>

                                {/* Stock Quantity */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Stock Quantity <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.stockQuantity}
                                        onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded focus:border-[#2563eb] focus:bg-white outline-none transition-all text-sm"
                                        required
                                    />
                                </div>

                                {/* Warranty Period */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Warranty (Months) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.warrantyPeriodMonths}
                                        onChange={(e) => setFormData({ ...formData, warrantyPeriodMonths: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded focus:border-[#2563eb] focus:bg-white outline-none transition-all text-sm"
                                        required
                                    />
                                </div>

                                {/* Shelf Life */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Shelf Life (Months) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.shelfLifeMonths}
                                        onChange={(e) => setFormData({ ...formData, shelfLifeMonths: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded focus:border-[#2563eb] focus:bg-white outline-none transition-all text-sm"
                                        placeholder="e.g., 6 or 12 months"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">How long can battery be stored before expiring</p>
                                </div>

                                {/* Sales Rep */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Sales Rep
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.salesRep}
                                        onChange={(e) => setFormData({ ...formData, salesRep: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded focus:border-[#2563eb] focus:bg-white outline-none transition-all text-sm"
                                        placeholder="Sales representative name"
                                    />
                                </div>

                                {/* Invoice Number */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Invoice Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.invoiceNumber}
                                        onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded focus:border-[#2563eb] focus:bg-white outline-none transition-all text-sm"
                                        placeholder="Invoice number"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="px-4 py-2 border-2 border-gray-400 text-gray-700 rounded hover:bg-gray-50 font-bold text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !batteryFound}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] text-white rounded hover:bg-[#1d4ed8] font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Save size={16} />
                                    )}
                                    {isSubmitting ? 'Updating...' : 'Update Battery'}
                                </button>
                            </div>
                        </form>
                    </div>
            </div>

            {/* Dialog */}
            <Dialog
                isOpen={dialog.isOpen}
                title={dialog.title}
                message={dialog.message}
                type={dialog.type}
                onConfirm={dialog.onConfirm}
                onClose={() => setDialog({ ...dialog, isOpen: false })}
            />

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

export default EditBattery;
