import React, { useState } from 'react';
import axios from 'axios';
import { X, DollarSign, Package } from 'lucide-react';
import { API_ENDPOINTS } from '../constants/constants';

const ReturnBatteryModal = ({ battery, user, onClose, onSuccess }) => {
    const [compensationType, setCompensationType] = useState('Money');
    const [moneyAmount, setMoneyAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Replacement battery details
    const [replacementBattery, setReplacementBattery] = useState({
        serialNumber: '',
        barcode: '',
        brand: '',
        model: '',
        capacity: '',
        voltage: 12,
        purchasePrice: 0,
        sellingPrice: 0,
        stockQuantity: 1,
        warrantyPeriodMonths: 12,
        shelfLifeMonths: 24
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                    replacementVoltage: parseFloat(replacementBattery.voltage),
                    replacementPurchasePrice: parseFloat(replacementBattery.purchasePrice),
                    replacementSellingPrice: parseFloat(replacementBattery.sellingPrice),
                    replacementPurchaseDate: new Date().toISOString(),
                    replacementStockQuantity: parseInt(replacementBattery.stockQuantity),
                    replacementWarrantyPeriodMonths: parseInt(replacementBattery.warrantyPeriodMonths),
                    replacementShelfLifeMonths: parseInt(replacementBattery.shelfLifeMonths)
                })
            };

            await axios.post(API_ENDPOINTS.RETURN, returnData, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            onSuccess('Battery return recorded successfully!');
            onClose();
        } catch (error) {
            console.error('Error creating return:', error);
            alert(error.response?.data?.message || 'Failed to create return. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const expiryDate = new Date(battery.purchaseDate);
    expiryDate.setMonth(expiryDate.getMonth() + (battery.shelfLifeMonths || 12));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-gradient-to-r from-red-500 to-orange-600 p-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Return Expired Battery</h2>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Battery Info */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <h3 className="font-bold text-lg mb-2">Battery Details</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <p><strong>Serial Number:</strong> {battery.serialNumber}</p>
                            <p><strong>Brand:</strong> {battery.brand}</p>
                            <p><strong>Model:</strong> {battery.model}</p>
                            <p><strong>Expiry Date:</strong> <span className="text-red-600 font-bold">{expiryDate.toLocaleDateString()}</span></p>
                        </div>
                    </div>

                    {/* Compensation Type */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Compensation Type *
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="Money"
                                    checked={compensationType === 'Money'}
                                    onChange={(e) => setCompensationType(e.target.value)}
                                    className="w-4 h-4"
                                />
                                <DollarSign size={20} />
                                <span>Money Refund</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="Replacement"
                                    checked={compensationType === 'Replacement'}
                                    onChange={(e) => setCompensationType(e.target.value)}
                                    className="w-4 h-4"
                                />
                                <Package size={20} />
                                <span>Replacement Battery</span>
                            </label>
                        </div>
                    </div>

                    {/* Money Amount */}
                    {compensationType === 'Money' && (
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Refund Amount (LKR) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={moneyAmount}
                                onChange={(e) => setMoneyAmount(e.target.value)}
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                                required
                            />
                        </div>
                    )}

                    {/* Replacement Battery Form */}
                    {compensationType === 'Replacement' && (
                        <div className="mb-6 border-2 border-blue-200 p-4 rounded-lg">
                            <h3 className="font-bold text-lg mb-4">Replacement Battery Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Serial Number *</label>
                                    <input
                                        type="text"
                                        value={replacementBattery.serialNumber}
                                        onChange={(e) => setReplacementBattery({ ...replacementBattery, serialNumber: e.target.value })}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Barcode</label>
                                    <input
                                        type="text"
                                        value={replacementBattery.barcode}
                                        onChange={(e) => setReplacementBattery({ ...replacementBattery, barcode: e.target.value })}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Brand *</label>
                                    <input
                                        type="text"
                                        value={replacementBattery.brand}
                                        onChange={(e) => setReplacementBattery({ ...replacementBattery, brand: e.target.value })}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Model *</label>
                                    <input
                                        type="text"
                                        value={replacementBattery.model}
                                        onChange={(e) => setReplacementBattery({ ...replacementBattery, model: e.target.value })}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Capacity *</label>
                                    <input
                                        type="text"
                                        value={replacementBattery.capacity}
                                        onChange={(e) => setReplacementBattery({ ...replacementBattery, capacity: e.target.value })}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                                        placeholder="e.g., 65Ah"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Voltage *</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={replacementBattery.voltage}
                                        onChange={(e) => setReplacementBattery({ ...replacementBattery, voltage: e.target.value })}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Selling Price *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={replacementBattery.sellingPrice}
                                        onChange={(e) => setReplacementBattery({ ...replacementBattery, sellingPrice: e.target.value })}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Stock Quantity *</label>
                                    <input
                                        type="number"
                                        value={replacementBattery.stockQuantity}
                                        onChange={(e) => setReplacementBattery({ ...replacementBattery, stockQuantity: e.target.value })}
                                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows="3"
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
                            placeholder="Additional notes about this return..."
                        />
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-4 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Processing...' : 'Submit Return'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReturnBatteryModal;
