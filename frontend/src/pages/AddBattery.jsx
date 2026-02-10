import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Toast from '../components/Toast';
import { ArrowLeft, Save, Package, Loader2, ScanBarcode, Focus } from 'lucide-react';
import { API_ENDPOINTS } from '../constants/constants';
import ScannerContext from '../context/ScannerContext';
import PageHeader from '../components/PageHeader';

const AddBattery = () => {
    const { user } = useContext(AuthContext);
    const { setScanCallback, status: scannerStatus } = useContext(ScannerContext);
    const navigate = useNavigate();

    // Register scan callback for phone scanner
    useEffect(() => {
        if (scannerStatus === 'connected') {
            setScanCallback((barcode) => setFormData(prev => ({ ...prev, barcode })));
        }
    }, [scannerStatus, setScanCallback]);

    const [toast, setToast] = useState(null);
    const serialNumberRef = useRef(null);
    const barcodeRef = useRef(null);
    const [scanMode, setScanMode] = useState(false);
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
        warrantyPeriodMonths: '12',
        shelfLifeMonths: '24',
        salesRep: '',
        invoiceNumber: ''
    });
    const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });
    const [existingBatteries, setExistingBatteries] = useState([]);
    const [showBrandDropdown, setShowBrandDropdown] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle barcode scanner input — scanners type fast and press Enter
    const handleBarcodeKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            // Move focus to next field after scan
            setScanMode(false);
        }
    };

    const activateScanMode = () => {
        setScanMode(true);
        barcodeRef.current?.focus();
        barcodeRef.current?.select();
    };

    // Fetch existing batteries for autocomplete
    useEffect(() => {
        const fetchBatteries = async () => {
            try {
                const res = await axios.get(API_ENDPOINTS.BATTERY, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setExistingBatteries(res.data);
            } catch (err) {
                console.error('Error fetching batteries:', err);
            }
        };
        fetchBatteries();
    }, [user.token]);

    // Get unique brands and models
    const uniqueBrands = [...new Set(existingBatteries.map(b => b.brand))];
    const uniqueModels = [...new Set(existingBatteries.map(b => b.model))];

    // Filter suggestions based on input
    const filteredBrands = uniqueBrands.filter(brand =>
        brand.toLowerCase().includes(formData.brand.toLowerCase())
    );
    const filteredModels = uniqueModels.filter(model =>
        model.toLowerCase().includes(formData.model.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return; // Prevent double submit

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

            const response = await axios.post(API_ENDPOINTS.BATTERY, payload, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            // Show success toast with serial number
            setToast({ type: 'success', message: 'Battery added successfully!' });

            // Clear form
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
                warrantyPeriodMonths: '12',
                shelfLifeMonths: '24',
                salesRep: '',
                invoiceNumber: ''
            });

            // Focus on barcode field for continuous scanning, or serial number
            if (scanMode) {
                barcodeRef.current?.focus();
            } else {
                serialNumberRef.current?.focus();
            }
        } catch (error) {
            console.error('Error adding battery:', error);
            // Handle duplicate serial number error
            if (error.response?.status === 409) {
                const errorData = error.response.data;
                const existingBatt = errorData.existingBattery;
                setToast({
                    type: 'error',
                    message: `Duplicate Serial Number! This serial number (${errorData.serialNumber}) already exists in:\n${existingBatt.brand} ${existingBatt.model} (Barcode: ${existingBatt.barcode})`
                });
            } else {
                setToast({ type: 'error', message: error.response?.data?.message || 'Error adding battery' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="w-full max-w-[1400px] mx-auto p-2 sm:p-3 space-y-3">
                {/* Header */}
                <PageHeader title="Add New Battery" />

                {/* Back Button */}
                <div className="flex items-center justify-between bg-white border border-gray-300 rounded shadow-sm p-3">
                    <button
                        onClick={() => navigate('/inventory/view')}
                        className="flex items-center gap-1.5 text-gray-600 hover:text-[#2563eb] font-bold text-sm transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to Inventory
                    </button>
                    <div className="text-sm text-gray-500">Fill in all required fields</div>
                </div>

                {/* Form Card */}
                <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
                    <div className="bg-[#2563eb] px-4 py-3">
                        <h2 className="text-base font-bold text-white">Battery Information</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Serial Number */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Serial Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    ref={serialNumberRef}
                                    value={formData.serialNumber}
                                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded focus:border-[#2563eb] focus:bg-white outline-none transition-all text-sm"
                                    required
                                />
                            </div>

                            {/* Barcode with Scanner Support */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-700"
                                            >
                                                {brand}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Model with Autocomplete */}
                            <div className="relative">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-700"
                                            >
                                                {model}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Capacity */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                <p className="text-xs text-gray-500 mt-2">How long can battery be stored before expiring</p>
                            </div>

                            {/* Sales Rep */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                onClick={() => navigate('/inventory/view')}
                                className="px-4 py-2 border-2 border-gray-400 text-gray-700 rounded hover:bg-gray-50 font-bold text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] text-white rounded hover:bg-[#1d4ed8] font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <Save size={20} />
                                )}
                                {isSubmitting ? 'Adding Battery...' : 'Add Battery'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

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

export default AddBattery;
