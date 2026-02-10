import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import PrintableBill from '../components/PrintableBill';
import PageHeader from '../components/PageHeader';
import { Users, Phone, ShoppingCart, DollarSign, Calendar, ChevronDown, ChevronUp, Loader2, Search, Eye, X } from 'lucide-react';
import { API_ENDPOINTS } from '../constants/constants';

const Customers = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [sales, setSales] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'totalSpent', direction: 'desc' });
    const [expandedCustomer, setExpandedCustomer] = useState(null);
    const [selectedSale, setSelectedSale] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchSales();
    }, [user.token]);

    const fetchSales = async () => {
        try {
            setIsLoading(true);
            const res = await axios.get(API_ENDPOINTS.SALE, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setSales(res.data);
            processCustomers(res.data);
        } catch (err) {
            console.error('Error fetching sales:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const processCustomers = (salesData) => {
        const customerMap = new Map();

        salesData.forEach(sale => {
            const key = sale.customerPhone;

            if (!customerMap.has(key)) {
                customerMap.set(key, {
                    id: sale.customerId || '',
                    name: sale.customerName,
                    phone: sale.customerPhone,
                    totalPurchases: 0,
                    totalSpent: 0,
                    lastPurchaseDate: null,
                    sales: []
                });
            }

            const customer = customerMap.get(key);
            customer.totalPurchases += 1;
            customer.totalSpent += sale.totalAmount;
            customer.sales.push(sale);

            // Update NIC if a newer sale has one
            if (sale.customerId && !customer.id) {
                customer.id = sale.customerId;
            }
            // Update name to latest
            if (sale.customerName) {
                customer.name = sale.customerName;
            }

            const saleDate = new Date(sale.date);
            if (!customer.lastPurchaseDate || saleDate > new Date(customer.lastPurchaseDate)) {
                customer.lastPurchaseDate = sale.date;
            }
        });

        setCustomers(Array.from(customerMap.values()));
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getFilteredAndSortedCustomers = () => {
        let filtered = [...customers];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(customer =>
                customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                customer.phone.includes(searchQuery) ||
                customer.id.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Sorting
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                if (sortConfig.key === 'lastPurchaseDate') {
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

    const filteredCustomers = getFilteredAndSortedCustomers();

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="w-full max-w-[1400px] mx-auto p-2 sm:p-3 space-y-3">
                {/* Header */}
                <PageHeader title="Customers" />

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white p-4 rounded shadow-sm border border-gray-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Total Customers</p>
                                <h3 className="text-2xl font-extrabold text-gray-800 mt-1">{customers.length}</h3>
                            </div>
                            <div className="p-2 bg-blue-50 rounded"><Users size={24} className="text-[#2563eb]" /></div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded shadow-sm border border-gray-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Total Transactions</p>
                                <h3 className="text-2xl font-extrabold text-gray-800 mt-1">{sales.length}</h3>
                            </div>
                            <div className="p-2 bg-green-50 rounded"><ShoppingCart size={24} className="text-green-600" /></div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded shadow-sm border border-gray-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Total Revenue</p>
                                <h3 className="text-2xl font-extrabold text-gray-800 mt-1">
                                    LKR {sales.reduce((sum, s) => sum + s.totalAmount, 0).toLocaleString()}
                                </h3>
                            </div>
                            <div className="p-2 bg-purple-50 rounded"><DollarSign size={24} className="text-purple-600" /></div>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="text-center">
                            <Loader2 size={32} className="animate-spin text-[#2563eb] mx-auto mb-2" />
                            <p className="text-gray-500 font-medium text-sm">Loading customers...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Search */}
                        <div className="bg-white border border-gray-300 rounded shadow-sm p-3">
                            <div className="flex items-center gap-3">
                                <Search className="text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by name, phone, or customer ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:border-[#2563eb] outline-none transition-all text-sm"
                                />
                                <p className="text-xs text-gray-500">
                                    Showing <span className="font-bold text-[#2563eb]">{filteredCustomers.length}</span> of{' '}
                                    <span className="font-bold">{customers.length}</span>
                                </p>
                            </div>
                        </div>

                        {/* Customers Table */}
                        <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-[#2563eb] text-white text-left">
                                        <th className="px-3 py-2 text-xs font-bold uppercase">#</th>
                                        <th className="px-3 py-2 text-xs font-bold uppercase">Customer ID</th>
                                        <th onClick={() => handleSort('name')} className="px-3 py-2 text-xs font-bold uppercase cursor-pointer hover:bg-blue-700">
                                            Customer Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="px-3 py-2 text-xs font-bold uppercase">Phone</th>
                                        <th onClick={() => handleSort('totalPurchases')} className="px-3 py-2 text-xs font-bold uppercase cursor-pointer hover:bg-blue-700">
                                            Purchases {sortConfig.key === 'totalPurchases' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th onClick={() => handleSort('totalSpent')} className="px-3 py-2 text-xs font-bold uppercase cursor-pointer hover:bg-blue-700">
                                            Total Spent {sortConfig.key === 'totalSpent' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th onClick={() => handleSort('lastPurchaseDate')} className="px-3 py-2 text-xs font-bold uppercase cursor-pointer hover:bg-blue-700">
                                            Last Purchase {sortConfig.key === 'lastPurchaseDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="px-3 py-2 text-xs font-bold uppercase text-center">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCustomers.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-3 py-10 text-center text-gray-400 text-sm">
                                                No customers found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCustomers.map((customer, index) => (
                                            <React.Fragment key={customer.phone}>
                                                <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 transition-colors border-b border-gray-200`}>
                                                    <td className="px-3 py-2 text-gray-600 text-sm">{index + 1}</td>
                                                    <td className="px-3 py-2 text-gray-600 font-mono text-xs">{customer.id || '-'}</td>
                                                    <td className="px-3 py-2 text-gray-800 font-bold text-sm">{customer.name}</td>
                                                    <td className="px-3 py-2 text-gray-600 text-sm">{customer.phone}</td>
                                                    <td className="px-3 py-2 text-gray-800 text-sm">{customer.totalPurchases}</td>
                                                    <td className="px-3 py-2 text-gray-800 font-bold text-sm">
                                                        LKR {customer.totalSpent.toLocaleString()}
                                                    </td>
                                                    <td className="px-3 py-2 text-gray-600 text-sm">
                                                        {new Date(customer.lastPurchaseDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button
                                                            onClick={() =>
                                                                setExpandedCustomer(
                                                                    expandedCustomer === customer.phone ? null : customer.phone
                                                                )
                                                            }
                                                            className="text-[#2563eb] hover:text-[#1d4ed8] font-bold flex items-center justify-center mx-auto gap-1 text-xs"
                                                        >
                                                            {expandedCustomer === customer.phone ? (
                                                                <><ChevronUp size={14} /> Hide</>
                                                            ) : (
                                                                <><ChevronDown size={14} /> Show</>
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* Expanded Details */}
                                                {expandedCustomer === customer.phone && (
                                                    <tr>
                                                        <td colSpan="8" className="bg-gray-50 px-3 py-4 border-b border-gray-300">
                                                            <div className="max-w-6xl mx-auto">
                                                                <h3 className="text-sm font-bold text-gray-800 mb-3">
                                                                    Purchase History
                                                                </h3>
                                                                <div className="space-y-2">
                                                                    {customer.sales
                                                                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                                                                        .map((sale) => (
                                                                            <div
                                                                                key={sale.id}
                                                                                className="bg-white p-3 rounded border border-gray-200"
                                                                            >
                                                                                <div className="flex justify-between items-start mb-2">
                                                                                    <div className="flex-1">
                                                                                        <p className="text-xs text-gray-600">
                                                                                            Invoice: <span className="font-mono font-bold text-[#2563eb]">{sale.invoiceNumber}</span>
                                                                                        </p>
                                                                                        <p className="text-xs text-gray-600">
                                                                                            Date: {new Date(sale.date).toLocaleString()}
                                                                                        </p>
                                                                                        <p className="text-xs text-gray-600">
                                                                                            Cashier: {sale.cashierName}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className="flex flex-col items-end gap-2">
                                                                                        <div className="text-right">
                                                                                            <p className="text-xs text-gray-500">Total Amount</p>
                                                                                            <p className="text-lg font-extrabold text-green-700">
                                                                                                LKR {sale.totalAmount.toLocaleString()}
                                                                                            </p>
                                                                                            {sale.discount > 0 && (
                                                                                                <p className="text-[10px] text-orange-600">
                                                                                                    Discount: LKR {sale.discount}
                                                                                                </p>
                                                                                            )}
                                                                                        </div>
                                                                                        <button
                                                                                            onClick={() => setSelectedSale(sale)}
                                                                                            className="flex items-center gap-1 px-2 py-1 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded text-xs font-bold transition-colors"
                                                                                        >
                                                                                            <Eye size={14} /> View Invoice
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="mt-2 pt-2 border-t border-gray-200">
                                                                                    <p className="text-xs font-bold text-gray-700 mb-1">Items:</p>
                                                                                    <div className="space-y-0.5">
                                                                                        {sale.items.map((item, idx) => (
                                                                                            <div key={idx} className="flex justify-between text-xs text-gray-600">
                                                                                                <span>{item.brand} {item.model} (S/N: {item.serialNumber}) × {item.quantity}</span>
                                                                                                <span className="font-medium">LKR {item.subtotal.toLocaleString()}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Invoice Preview Modal - Same as Sales page */}
            {selectedSale && (
                <PrintableBill
                    saleData={selectedSale}
                    showPreview={true}
                    onClose={() => setSelectedSale(null)}
                />
            )}
        </div>
    );
};

export default Customers;
