import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import PrintableBill from '../components/PrintableBill';
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
            const customerId = sale.customerId;

            if (!customerMap.has(customerId)) {
                customerMap.set(customerId, {
                    id: customerId,
                    name: sale.customerName,
                    phone: sale.customerPhone,
                    totalPurchases: 0,
                    totalSpent: 0,
                    lastPurchaseDate: null,
                    sales: []
                });
            }

            const customer = customerMap.get(customerId);
            customer.totalPurchases += 1;
            customer.totalSpent += sale.totalAmount;
            customer.sales.push(sale);

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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
            <div className="container mx-auto px-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Customers
                            </h1>
                            <p className="text-gray-600 mt-1">View customer details and purchase history</p>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-white p-4 rounded-xl shadow-md border border-blue-100">
                            <p className="text-gray-600 text-sm">Total Customers</p>
                            <h3 className="text-2xl font-bold text-gray-800">{customers.length}</h3>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-md border border-green-100">
                            <p className="text-gray-600 text-sm">Total Transactions</p>
                            <h3 className="text-2xl font-bold text-gray-800">{sales.length}</h3>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-md border border-purple-100">
                            <p className="text-gray-600 text-sm">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-gray-800">
                                LKR {sales.reduce((sum, s) => sum + s.totalAmount, 0).toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-gray-600 font-medium">Loading customers...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Search */}
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
                            <div className="flex items-center gap-4">
                                <Search className="text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by name, phone, or customer ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition-all"
                                />
                                <p className="text-sm text-gray-600">
                                    Showing <span className="font-bold text-blue-600">{filteredCustomers.length}</span> of{' '}
                                    <span className="font-bold">{customers.length}</span> customers
                                </p>
                            </div>
                        </div>

                        {/* Customers Table */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-blue-500 to-indigo-600">
                                        <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                                            #
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                                            Customer ID
                                        </th>
                                        <th
                                            onClick={() => handleSort('name')}
                                            className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-600"
                                        >
                                            Customer Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                                            Phone
                                        </th>
                                        <th
                                            onClick={() => handleSort('totalPurchases')}
                                            className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-600"
                                        >
                                            Purchases {sortConfig.key === 'totalPurchases' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th
                                            onClick={() => handleSort('totalSpent')}
                                            className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-600"
                                        >
                                            Total Spent {sortConfig.key === 'totalSpent' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th
                                            onClick={() => handleSort('lastPurchaseDate')}
                                            className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-blue-600"
                                        >
                                            Last Purchase {sortConfig.key === 'lastPurchaseDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-bold text-white uppercase tracking-wider">
                                            Details
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCustomers.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                                No customers found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCustomers.map((customer, index) => (
                                            <React.Fragment key={customer.id}>
                                                <tr
                                                    className="border-b border-gray-200 hover:bg-blue-50 transition-colors"
                                                >
                                                    <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                    <td className="px-6 py-4 text-gray-600 font-mono text-sm">{customer.id}</td>
                                                    <td className="px-6 py-4 text-gray-800 font-medium">{customer.name}</td>
                                                    <td className="px-6 py-4 text-gray-600">{customer.phone}</td>
                                                    <td className="px-6 py-4 text-gray-800">{customer.totalPurchases}</td>
                                                    <td className="px-6 py-4 text-gray-800 font-bold">
                                                        LKR {customer.totalSpent.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">
                                                        {new Date(customer.lastPurchaseDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() =>
                                                                setExpandedCustomer(
                                                                    expandedCustomer === customer.id ? null : customer.id
                                                                )
                                                            }
                                                            className="text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center mx-auto gap-1"
                                                        >
                                                            {expandedCustomer === customer.id ? (
                                                                <>
                                                                    <ChevronUp size={18} /> Hide
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ChevronDown size={18} /> Show
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* Expanded Details */}
                                                {expandedCustomer === customer.id && (
                                                    <tr>
                                                        <td colSpan="8" className="bg-gray-50 px-6 py-6">
                                                            <div className="max-w-6xl mx-auto">
                                                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                                                    Purchase History
                                                                </h3>
                                                                <div className="space-y-3">
                                                                    {customer.sales
                                                                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                                                                        .map((sale) => (
                                                                            <div
                                                                                key={sale.id}
                                                                                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                                                                            >
                                                                                <div className="flex justify-between items-start mb-2">
                                                                                    <div className="flex-1">
                                                                                        <p className="text-sm text-gray-600">
                                                                                            Invoice: <span className="font-mono font-bold text-blue-600">{sale.invoiceNumber}</span>
                                                                                        </p>
                                                                                        <p className="text-sm text-gray-600">
                                                                                            Date: {new Date(sale.date).toLocaleString()}
                                                                                        </p>
                                                                                        <p className="text-sm text-gray-600">
                                                                                            Cashier: {sale.cashierName}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className="flex flex-col items-end gap-2">
                                                                                        <div className="text-right">
                                                                                            <p className="text-sm text-gray-600">Total Amount</p>
                                                                                            <p className="text-xl font-bold text-green-600">
                                                                                                LKR {sale.totalAmount.toLocaleString()}
                                                                                            </p>
                                                                                            {sale.discount > 0 && (
                                                                                                <p className="text-xs text-orange-600">
                                                                                                    Discount: LKR {sale.discount}
                                                                                                </p>
                                                                                            )}
                                                                                        </div>
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                console.log('View Invoice clicked', sale);
                                                                                                setSelectedSale(sale);
                                                                                            }}
                                                                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                                                                                        >
                                                                                            <Eye size={16} />
                                                                                            View Invoice
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                                                    <p className="text-sm font-semibold text-gray-700 mb-2">
                                                                                        Items:
                                                                                    </p>
                                                                                    <div className="space-y-1">
                                                                                        {sale.items.map((item, idx) => (
                                                                                            <div
                                                                                                key={idx}
                                                                                                className="flex justify-between text-sm text-gray-600"
                                                                                            >
                                                                                                <span>
                                                                                                    {item.brand} {item.model} (S/N: {item.serialNumber})
                                                                                                    {' × '}
                                                                                                    {item.quantity}
                                                                                                </span>
                                                                                                <span className="font-medium">
                                                                                                    LKR {item.subtotal.toLocaleString()}
                                                                                                </span>
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
