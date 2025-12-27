import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Dialog from '../components/Dialog';
import { ArrowLeft, Save, Package, Loader2 } from 'lucide-react';
import { API_ENDPOINTS } from '../constants/constants';

const AddBattery = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        serialNumber: '',
        barcode: '',
        brand: '',
        model: '',
        capacity: '',
        purchasePrice: '',
        sellingPrice: '',
        purchaseDate: '',
        stockQuantity: '',
        warrantyPeriodMonths: '',
        shelfLifeMonths: ''
    });
    const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });
    const [existingBatteries, setExistingBatteries] = useState([]);
    const [showBrandDropdown, setShowBrandDropdown] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
                capacity: parseFloat(formData.capacity),
                purchasePrice: parseFloat(formData.purchasePrice),
                sellingPrice: parseFloat(formData.sellingPrice),
                stockQuantity: parseInt(formData.stockQuantity),
                warrantyPeriodMonths: parseInt(formData.warrantyPeriodMonths),
                shelfLifeMonths: parseInt(formData.shelfLifeMonths)
            };

            await axios.post('http://localhost:5038/api/Battery', payload, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            setDialog({
                isOpen: true,
                title: 'Success',
                message: 'Battery added successfully!',
                type: 'success',
                onConfirm: () => navigate('/inventory/view')
            });
        } catch (err) {
            setDialog({
                isOpen: true,
                title: 'Error',
                message: err.response?.data?.message || 'Failed to add battery',
                type: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/inventory/view')}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 font-medium transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back to Inventory
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Package className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Add New Battery
                            </h1>
                            <p className="text-gray-600 mt-1">Enter battery details to add to inventory</p>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-6">
                        <h2 className="text-xl font-bold text-white">Battery Information</h2>
                        <p className="text-blue-100 text-sm mt-1">Fill in all required fields</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Serial Number */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Serial Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.serialNumber}
                                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
                                    required
                                />
                            </div>

                            {/* Barcode */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Barcode</label>
                                <input
                                    type="text"
                                    value={formData.barcode}
                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
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
                                    value={formData.brand}
                                    onChange={(e) => {
                                        setFormData({ ...formData, brand: e.target.value });
                                        setShowBrandDropdown(true);
                                    }}
                                    onFocus={() => setShowBrandDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowBrandDropdown(false), 200)}
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
                                    required
                                    placeholder="Type or select brand"
                                />
                                {showBrandDropdown && filteredBrands.length > 0 && formData.brand && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-48 overflow-y-auto z-10">
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
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
                                    required
                                    placeholder="Type or select model"
                                />
                                {showModelDropdown && filteredModels.length > 0 && formData.model && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-48 overflow-y-auto z-10">
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
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
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
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
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
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
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
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
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
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
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
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
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
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
                                    placeholder="e.g., 6 or 12 months"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-2">How long can battery be stored before expiring</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 justify-end mt-8 pt-6 border-t border-gray-200">
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
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 font-medium shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Dialog */}
            {dialog.isOpen && (
                <Dialog
                    title={dialog.title}
                    message={dialog.message}
                    type={dialog.type}
                    onClose={() => setDialog({ ...dialog, isOpen: false })}
                    onConfirm={dialog.onConfirm}
                />
            )}
        </div>
    );
};

export default AddBattery;
