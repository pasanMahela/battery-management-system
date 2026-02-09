import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Toast from '../components/Toast';
import { ArrowLeft, RotateCcw, DollarSign, Package, Loader2, AlertTriangle } from 'lucide-react';
import { API_ENDPOINTS, APP_CONFIG, BUSINESS_DEFAULTS } from '../constants/constants';

const Returns = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const battery = location.state?.battery;
    
    const [toast, setToast] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [compensationType, setCompensationType] = useState('Money');
    const [moneyAmount, setMoneyAmount] = useState('');
    const [notes, setNotes] = useState('');
    
    // Replacement battery form
    const [replacementBattery, setReplacementBattery] = useState({
        serialNumber: '',
        barcode: '',
        brand: '',
        model: '',
        capacity: '',
        voltage: String(BUSINESS_DEFAULTS.DEFAULT_VOLTAGE),
        purchasePrice: '',
        sellingPrice: '',
        stockQuantity: '1',
        warrantyPeriodMonths: String(BUSINESS_DEFAULTS.DEFAULT_WARRANTY_MONTHS),
        shelfLifeMonths: String(BUSINESS_DEFAULTS.DEFAULT_SHELF_LIFE_MONTHS),
        salesRep: '',
        invoiceNumber: ''
    });
    
    // Autocomplete states
    const [existingBatteries, setExistingBatteries] = useState([]);
    const [showBrandDropdown, setShowBrandDropdown] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    
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
        if (user?.token) {
            fetchBatteries();
        }
    }, [user?.token]);
    
    // Redirect if no battery data
    useEffect(() => {
        if (!battery) {
            navigate('/inventory/view');
        }
    }, [battery, navigate]);
    
    if (!battery) {
        return null;
    }
    
    // Calculate expiry date
    const purchaseDate = new Date(battery.purchaseDate);
    const expiryDate = new Date(purchaseDate);
    expiryDate.setMonth(expiryDate.getMonth() + (battery.shelfLifeMonths || 12));
    
    // Get unique brands and models for autocomplete
    const uniqueBrands = [...new Set(existingBatteries.map(b => b.brand))];
    const uniqueModels = [...new Set(existingBatteries.map(b => b.model))];
    
    const filteredBrands = uniqueBrands.filter(brand =>
        brand.toLowerCase().includes(replacementBattery.brand.toLowerCase())
    );
    const filteredModels = uniqueModels.filter(model =>
        model.toLowerCase().includes(replacementBattery.model.toLowerCase())
    );
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        
        // Validation
        if (compensationType === 'Money' && !moneyAmount) {
            setToast({ message: 'Please enter the refund amount', type: 'error' });
            return;
        }
        
        if (compensationType === 'Replacement') {
            if (!replacementBattery.serialNumber || !replacementBattery.brand || 
                !replacementBattery.model || !replacementBattery.capacity) {
                setToast({ message: 'Please fill in all required replacement battery fields', type: 'error' });
                return;
            }
        }
        
        setIsSubmitting(true);
        
        try {
            const returnData = {
                batteryId: battery.id,
                compensationType,
                moneyAmount: compensationType === 'Money' ? parseFloat(moneyAmount) : null,
                notes,
                ...(compensationType === 'Replacement' && {
                    replacementSerialNumber: replacementBattery.serialNumber,
                    replacementBarcode: replacementBattery.barcode,
                    replacementBrand: replacementBattery.brand,
                    replacementModel: replacementBattery.model,
                    replacementCapacity: replacementBattery.capacity,
                    replacementVoltage: parseFloat(replacementBattery.voltage) || BUSINESS_DEFAULTS.DEFAULT_VOLTAGE,
                    replacementPurchasePrice: parseFloat(replacementBattery.purchasePrice) || 0,
                    replacementSellingPrice: parseFloat(replacementBattery.sellingPrice) || 0,
                    replacementPurchaseDate: new Date().toISOString(),
                    replacementStockQuantity: parseInt(replacementBattery.stockQuantity) || 1,
                    replacementWarrantyPeriodMonths: parseInt(replacementBattery.warrantyPeriodMonths) || BUSINESS_DEFAULTS.DEFAULT_WARRANTY_MONTHS,
                    replacementShelfLifeMonths: parseInt(replacementBattery.shelfLifeMonths) || BUSINESS_DEFAULTS.DEFAULT_SHELF_LIFE_MONTHS,
                    replacementSalesRep: replacementBattery.salesRep || '',
                    replacementInvoiceNumber: replacementBattery.invoiceNumber || ''
                })
            };
            
            await axios.post(API_ENDPOINTS.RETURN, returnData, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            
            setToast({ message: 'Battery return recorded successfully!', type: 'success' });
            
            // Navigate back to inventory after a short delay
            setTimeout(() => {
                navigate('/inventory/view');
            }, 1500);
        } catch (error) {
            console.error('Error creating return:', error);
            setToast({ 
                message: error.response?.data?.message || 'Failed to create return. Please try again.', 
                type: 'error' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/inventory/view')}
                        className="flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-4 font-medium transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back to Inventory
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <RotateCcw className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                Process Battery Return
                            </h1>
                            <p className="text-gray-600 mt-1">Record return details for expired battery</p>
                        </div>
                    </div>
                </div>
                
                {/* Battery Info Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-red-500 to-orange-600 px-8 py-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6 text-white" />
                            <h2 className="text-xl font-bold text-white">Expired Battery Details</h2>
                        </div>
                    </div>
                    <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 font-medium">Serial Number</p>
                                <p className="text-sm sm:text-lg font-bold text-gray-800 break-all">{battery.serialNumber}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 font-medium">Brand</p>
                                <p className="text-sm sm:text-lg font-bold text-gray-800">{battery.brand}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 font-medium">Model</p>
                                <p className="text-sm sm:text-lg font-bold text-gray-800">{battery.model}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 font-medium">Capacity</p>
                                <p className="text-sm sm:text-lg font-bold text-gray-800">{battery.capacity} Ah</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 font-medium">Purchase Date</p>
                                <p className="text-sm sm:text-lg font-bold text-gray-800">{purchaseDate.toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 font-medium">Expiry Date</p>
                                <p className="text-sm sm:text-lg font-bold text-red-600">{expiryDate.toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 font-medium">Purchase Price</p>
                                <p className="text-sm sm:text-lg font-bold text-gray-800">{APP_CONFIG.CURRENCY} {battery.purchasePrice?.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 font-medium">Selling Price</p>
                                <p className="text-sm sm:text-lg font-bold text-gray-800">{APP_CONFIG.CURRENCY} {battery.sellingPrice?.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Return Form */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-red-600 px-8 py-6">
                        <h2 className="text-xl font-bold text-white">Return Compensation</h2>
                        <p className="text-orange-100 text-sm mt-1">Select how the manufacturer/supplier will compensate</p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-8">
                        {/* Compensation Type Selection */}
                        <div className="mb-8">
                            <label className="block text-sm font-semibold text-gray-700 mb-4">
                                Compensation Type <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label 
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                        compensationType === 'Money' 
                                            ? 'border-green-500 bg-green-50' 
                                            : 'border-gray-200 hover:border-green-300'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        value="Money"
                                        checked={compensationType === 'Money'}
                                        onChange={(e) => setCompensationType(e.target.value)}
                                        className="w-5 h-5 text-green-600"
                                    />
                                    <DollarSign size={24} className={compensationType === 'Money' ? 'text-green-600' : 'text-gray-400'} />
                                    <div>
                                        <span className="font-semibold text-gray-800">Money Refund</span>
                                        <p className="text-sm text-gray-500 hidden sm:block">Receive monetary compensation</p>
                                    </div>
                                </label>
                                <label 
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                        compensationType === 'Replacement' 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        value="Replacement"
                                        checked={compensationType === 'Replacement'}
                                        onChange={(e) => setCompensationType(e.target.value)}
                                        className="w-5 h-5 text-blue-600"
                                    />
                                    <Package size={24} className={compensationType === 'Replacement' ? 'text-blue-600' : 'text-gray-400'} />
                                    <div>
                                        <span className="font-semibold text-gray-800">Replacement Battery</span>
                                        <p className="text-sm text-gray-500 hidden sm:block">Receive a new battery</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        {/* Money Amount Input */}
                        {compensationType === 'Money' && (
                            <div className="mb-8 p-6 bg-green-50 rounded-xl border-2 border-green-200">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Refund Amount ({APP_CONFIG.CURRENCY}) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={moneyAmount}
                                    onChange={(e) => setMoneyAmount(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border-2 border-green-300 rounded-xl focus:border-green-500 outline-none transition-all text-xl font-bold"
                                    placeholder="Enter refund amount"
                                    required={compensationType === 'Money'}
                                />
                            </div>
                        )}
                        
                        {/* Replacement Battery Form */}
                        {compensationType === 'Replacement' && (
                            <div className="mb-8 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Package size={20} className="text-blue-600" />
                                    Replacement Battery Details
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Serial Number */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Serial Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={replacementBattery.serialNumber}
                                            onChange={(e) => setReplacementBattery({ ...replacementBattery, serialNumber: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all"
                                            required={compensationType === 'Replacement'}
                                        />
                                    </div>
                                    
                                    {/* Barcode */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Barcode</label>
                                        <input
                                            type="text"
                                            value={replacementBattery.barcode}
                                            onChange={(e) => setReplacementBattery({ ...replacementBattery, barcode: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all"
                                            placeholder="Optional"
                                        />
                                    </div>
                                    
                                    {/* Brand with Autocomplete */}
                                    <div className="relative">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Brand <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={replacementBattery.brand}
                                            onChange={(e) => {
                                                setReplacementBattery({ ...replacementBattery, brand: e.target.value });
                                                setShowBrandDropdown(true);
                                            }}
                                            onFocus={() => setShowBrandDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowBrandDropdown(false), 200)}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all"
                                            required={compensationType === 'Replacement'}
                                            placeholder="Type or select brand"
                                        />
                                        {showBrandDropdown && filteredBrands.length > 0 && replacementBattery.brand && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-48 overflow-y-auto z-10">
                                                {filteredBrands.map((brand, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => {
                                                            setReplacementBattery({ ...replacementBattery, brand });
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
                                            value={replacementBattery.model}
                                            onChange={(e) => {
                                                setReplacementBattery({ ...replacementBattery, model: e.target.value });
                                                setShowModelDropdown(true);
                                            }}
                                            onFocus={() => setShowModelDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowModelDropdown(false), 200)}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all"
                                            required={compensationType === 'Replacement'}
                                            placeholder="Type or select model"
                                        />
                                        {showModelDropdown && filteredModels.length > 0 && replacementBattery.model && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-48 overflow-y-auto z-10">
                                                {filteredModels.map((model, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => {
                                                            setReplacementBattery({ ...replacementBattery, model });
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
                                            value={replacementBattery.capacity}
                                            onChange={(e) => setReplacementBattery({ ...replacementBattery, capacity: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all"
                                            required={compensationType === 'Replacement'}
                                        />
                                    </div>
                                    
                                    {/* Voltage */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Voltage <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={replacementBattery.voltage}
                                            onChange={(e) => setReplacementBattery({ ...replacementBattery, voltage: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all"
                                            required={compensationType === 'Replacement'}
                                        />
                                    </div>
                                    
                                    {/* Purchase Price */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Purchase Price ({APP_CONFIG.CURRENCY})
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={replacementBattery.purchasePrice}
                                            onChange={(e) => setReplacementBattery({ ...replacementBattery, purchasePrice: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all"
                                            placeholder="0"
                                        />
                                    </div>
                                    
                                    {/* Selling Price */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Selling Price ({APP_CONFIG.CURRENCY})
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={replacementBattery.sellingPrice}
                                            onChange={(e) => setReplacementBattery({ ...replacementBattery, sellingPrice: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all"
                                            placeholder="0"
                                        />
                                    </div>
                                    
                                    {/* Stock Quantity */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Stock Quantity <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={replacementBattery.stockQuantity}
                                            onChange={(e) => setReplacementBattery({ ...replacementBattery, stockQuantity: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all"
                                            required={compensationType === 'Replacement'}
                                        />
                                    </div>
                                    
                                    {/* Warranty Period */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Warranty (Months)
                                        </label>
                                        <input
                                            type="number"
                                            value={replacementBattery.warrantyPeriodMonths}
                                            onChange={(e) => setReplacementBattery({ ...replacementBattery, warrantyPeriodMonths: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    
                                    {/* Shelf Life */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Shelf Life (Months)
                                        </label>
                                        <input
                                            type="number"
                                            value={replacementBattery.shelfLifeMonths}
                                            onChange={(e) => setReplacementBattery({ ...replacementBattery, shelfLifeMonths: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    
                                    {/* Sales Rep */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Sales Rep
                                        </label>
                                        <input
                                            type="text"
                                            value={replacementBattery.salesRep}
                                            onChange={(e) => setReplacementBattery({ ...replacementBattery, salesRep: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all"
                                            placeholder="Optional"
                                        />
                                    </div>
                                    
                                    {/* Invoice Number */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Invoice Number
                                        </label>
                                        <input
                                            type="text"
                                            value={replacementBattery.invoiceNumber}
                                            onChange={(e) => setReplacementBattery({ ...replacementBattery, invoiceNumber: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all"
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Notes */}
                        <div className="mb-8">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Notes
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows="3"
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:bg-white outline-none transition-all"
                                placeholder="Additional notes about this return..."
                            />
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-4 justify-end pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => navigate('/inventory/view')}
                                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 font-medium shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <RotateCcw size={20} />
                                )}
                                {isSubmitting ? 'Processing Return...' : 'Submit Return'}
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

export default Returns;

