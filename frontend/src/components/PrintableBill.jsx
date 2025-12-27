import { useRef, useEffect, useState } from 'react';
import { Printer, X } from 'lucide-react';

const PrintableBill = ({ saleData, showPreview = false, autoPrint = false, onClose }) => {
    const printRef = useRef();
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        if (autoPrint && saleData && !showPreview) {
            // Auto-print only if preview is not enabled
            setTimeout(() => {
                handlePrint();
            }, 100);
        }
    }, [autoPrint, saleData, showPreview]);

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
            if (onClose) {
                onClose();
            }
        }, 100);
    };

    if (!saleData) return null;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            {/* Preview Modal */}
            {showPreview && !isPrinting && (
                <div className="no-print fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Printer size={24} /> Print Receipt
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Receipt Preview */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 font-mono text-sm">
                                {/* Header */}
                                <div className="text-center mb-4 border-b-2 border-dashed border-gray-300 pb-4">
                                    <h1 className="text-xl font-extrabold tracking-wider">RUHUNU TYRE HOUSE</h1>
                                    <p className="text-xs text-gray-600 mt-1">Battery Sales & Service</p>
                                </div>

                                {/* Sale Info */}
                                <div className="mb-4 space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="font-bold">Date:</span>
                                        <span>{formatDate(saleData.date || new Date())}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold">Invoice #:</span>
                                        <span className="font-mono">{saleData.invoiceNumber || 'PENDING'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold">Cashier:</span>
                                        <span>{saleData.cashierName || 'N/A'}</span>
                                    </div>
                                    <div className="border-b border-dashed border-gray-300 my-2"></div>
                                </div>

                                {/* Customer Info */}
                                <div className="mb-4 space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="font-bold">Customer:</span>
                                        <span>{saleData.customerName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold">Phone:</span>
                                        <span>{saleData.customerPhone}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold">ID:</span>
                                        <span>{saleData.customerId}</span>
                                    </div>
                                    <div className="border-b-2 border-gray-800 my-2"></div>
                                </div>

                                {/* Items */}
                                <div className="mb-4">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-gray-800">
                                                <th className="text-left py-1 font-bold">ITEM</th>
                                                <th className="text-center py-1 font-bold">QTY</th>
                                                <th className="text-right py-1 font-bold">PRICE</th>
                                                <th className="text-right py-1 font-bold">TOTAL</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {saleData.items && saleData.items.map((item, index) => (
                                                <tr key={index} className="border-b border-dashed border-gray-200">
                                                    <td className="py-2">
                                                        <div className="font-bold">{item.brand} {item.model}</div>
                                                        <div className="text-[10px] text-gray-500">SN: {item.serialNumber}</div>
                                                        {item.warrantyExpiryDate && (
                                                            <div className="text-[10px] text-green-600 font-medium">
                                                                Warranty: {new Date(item.warrantyStartDate).toLocaleDateString()} - {new Date(item.warrantyExpiryDate).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="text-center">{item.quantity}</td>
                                                    <td className="text-right">{(item.unitPrice || 0).toLocaleString()}</td>
                                                    <td className="text-right">{((item.unitPrice || 0) * item.quantity).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="border-b border-dashed border-gray-300 my-2"></div>
                                </div>

                                {/* Totals */}
                                <div className="mb-4 space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="font-bold">Subtotal:</span>
                                        <span>LKR {((saleData.totalAmount || 0) + (saleData.discount || 0)).toLocaleString()}</span>
                                    </div>
                                    {saleData.discount > 0 && (
                                        <div className="flex justify-between text-red-600">
                                            <span className="font-bold">Discount:</span>
                                            <span>- LKR {(saleData.discount || 0).toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="border-b-2 border-gray-800 my-2"></div>
                                    <div className="flex justify-between text-base font-extrabold">
                                        <span>TOTAL:</span>
                                        <span>LKR {(saleData.totalAmount || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="border-b-2 border-gray-800 my-2"></div>
                                </div>

                                {/* Footer */}
                                <div className="text-center text-xs space-y-1 pt-2 border-t border-dashed border-gray-300">
                                    <p className="font-bold">Thank you for your business!</p>
                                    <p className="text-[10px] text-gray-600">Please keep this receipt for warranty claims</p>
                                    <div className="border-b border-dashed border-gray-300 my-2"></div>
                                    <p className="text-[10px] text-gray-500">
                                        Warranty: {saleData.items && saleData.items[0] ? saleData.items[0].warrantyMonths || 12 : 12} months from date of purchase
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-4 bg-gray-100 border-t border-gray-200 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-lg flex items-center justify-center gap-2"
                            >
                                <Printer size={20} /> Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Print Button for non-preview mode */}
            {!showPreview && !autoPrint && (
                <button
                    onClick={handlePrint}
                    className="no-print fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-bold z-50 transition-all"
                >
                    <Printer size={20} /> Print Receipt
                </button>
            )}

            {/* Printable Receipt - Hidden on screen, visible when printing */}
            <div ref={printRef} className="print-only">
                <div className="receipt">
                    {/* Header */}
                    <div className="receipt-header">
                        <h1>RUHUNU TYRE HOUSE</h1>
                        <p>Battery Sales & Service</p>
                        <div className="divider"></div>
                    </div>

                    {/* Sale Info */}
                    <div className="receipt-section">
                        <div className="info-row">
                            <span>Date:</span>
                            <span>{formatDate(saleData.date || new Date())}</span>
                        </div>
                        <div className="info-row">
                            <span>Invoice #:</span>
                            <span>{saleData.invoiceNumber || 'PENDING'}</span>
                        </div>
                        <div className="info-row">
                            <span>Cashier:</span>
                            <span>{saleData.cashierName || 'N/A'}</span>
                        </div>
                        <div className="divider"></div>
                    </div>

                    {/* Customer Info */}
                    <div className="receipt-section">
                        <div className="info-row">
                            <span>Customer:</span>
                            <span>{saleData.customerName}</span>
                        </div>
                        <div className="info-row">
                            <span>Phone:</span>
                            <span>{saleData.customerPhone}</span>
                        </div>
                        <div className="info-row">
                            <span>ID:</span>
                            <span>{saleData.customerId}</span>
                        </div>
                        <div className="divider-bold"></div>
                    </div>

                    {/* Items */}
                    <div className="receipt-section">
                        <table className="items-table">
                            <thead>
                                <tr>
                                    <th>ITEM</th>
                                    <th>QTY</th>
                                    <th>PRICE</th>
                                    <th>TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {saleData.items && saleData.items.map((item, index) => (
                                    <tr key={index}>
                                        <td>
                                            <div className="item-name">{item.brand} {item.model}</div>
                                            <div className="item-serial">SN: {item.serialNumber}</div>
                                            {item.warrantyExpiryDate && (
                                                <div className="item-warranty">Warranty: {new Date(item.warrantyStartDate).toLocaleDateString()} - {new Date(item.warrantyExpiryDate).toLocaleDateString()}</div>
                                            )}
                                        </td>
                                        <td className="text-center">{item.quantity}</td>
                                        <td className="text-right">{(item.unitPrice || 0).toLocaleString()}</td>
                                        <td className="text-right">{((item.unitPrice || 0) * item.quantity).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="divider"></div>
                    </div>

                    {/* Totals */}
                    <div className="receipt-section">
                        <div className="total-row">
                            <span>Subtotal:</span>
                            <span>LKR {((saleData.totalAmount || 0) + (saleData.discount || 0)).toLocaleString()}</span>
                        </div>
                        {saleData.discount > 0 && (
                            <div className="total-row discount">
                                <span>Discount:</span>
                                <span>- LKR {(saleData.discount || 0).toLocaleString()}</span>
                            </div>
                        )}
                        <div className="divider-bold"></div>
                        <div className="total-row grand-total">
                            <span>TOTAL:</span>
                            <span>LKR {(saleData.totalAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="divider-bold"></div>
                    </div>

                    {/* Footer */}
                    <div className="receipt-footer">
                        <p>Thank you for your business!</p>
                        <p>Please keep this receipt for warranty claims</p>
                        <div className="divider"></div>
                        <p className="small">Warranty: {saleData.items && saleData.items[0] ? saleData.items[0].warrantyMonths || 12 : 12} months from date of purchase</p>
                    </div>
                </div>
            </div>

            {/* Print-specific styles */}
            <style>{`
                /* Hide print elements on screen */
                .print-only {
                    display: none;
                }

                /* Print styles */
                @media print {
                    /* Hide everything except receipt */
                    body * {
                        visibility: hidden;
                    }

                    .print-only,
                    .print-only * {
                        visibility: visible;
                    }

                    .print-only {
                        display: block;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }

                    /* Hide non-printable elements */
                    .no-print {
                        display: none !important;
                    }

                    /* Page setup for thermal printer (80mm width) */
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }

                    body {
                        margin: 0;
                        padding: 0;
                    }

                    /* Receipt container */
                    .receipt {
                        width: 80mm;
                        font-family: 'Courier New', monospace;
                        font-size: 10pt;
                        padding: 5mm;
                        margin: 0 auto;
                        background: white;
                    }

                    /* Header */
                    .receipt-header {
                        text-align: center;
                        margin-bottom: 8px;
                    }

                    .receipt-header h1 {
                        font-size: 14pt;
                        font-weight: bold;
                        margin: 0 0 4px 0;
                        letter-spacing: 1px;
                    }

                    .receipt-header p {
                        font-size: 9pt;
                        margin: 2px 0;
                    }

                    /* Sections */
                    .receipt-section {
                        margin-bottom: 8px;
                    }

                    /* Info rows */
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        font-size: 9pt;
                        margin: 3px 0;
                    }

                    .info-row span:first-child {
                        font-weight: bold;
                    }

                    /* Dividers */
                    .divider {
                        border-top: 1px dashed #000;
                        margin: 6px 0;
                    }

                    .divider-bold {
                        border-top: 2px solid #000;
                        margin: 6px 0;
                    }

                    /* Items table */
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 9pt;
                        margin: 6px 0;
                    }

                    .items-table th {
                        text-align: left;
                        font-weight: bold;
                        border-bottom: 1px solid #000;
                        padding: 3px 0;
                        font-size: 8pt;
                    }

                    .items-table td {
                        padding: 4px 0;
                        vertical-align: top;
                    }

                    .item-name {
                        font-weight: bold;
                        font-size: 9pt;
                    }

                    .item-serial {
                        font-size: 7pt;
                        color: #333;
                    }

                    .item-warranty {
                        font-size: 7pt;
                        color: #006600;
                        font-weight: bold;
                    }

                    .text-center {
                        text-align: center;
                    }

                    .text-right {
                        text-align: right;
                    }

                    /* Totals */
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        font-size: 10pt;
                        margin: 4px 0;
                    }

                    .total-row.discount {
                        font-style: italic;
                    }

                    .total-row.grand-total {
                        font-size: 12pt;
                        font-weight: bold;
                    }

                    .total-row.grand-total span {
                        font-weight: bold;
                    }

                    /* Footer */
                    .receipt-footer {
                        text-align: center;
                        margin-top: 10px;
                        font-size: 9pt;
                    }

                    .receipt-footer p {
                        margin: 4px 0;
                    }

                    .receipt-footer .small {
                        font-size: 7pt;
                        color: #333;
                    }
                }
            `}</style>
        </>
    );
};

export default PrintableBill;
