import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Dialog from '../components/Dialog';
import PrintableBill from '../components/PrintableBill';
import { ShoppingCart, Trash2, Search, Plus, Minus, CheckCircle, Battery, User, Phone, Edit2, X, ChevronRight, Filter, Loader2, ScanBarcode } from 'lucide-react';
import { API_ENDPOINTS } from '../constants/constants';
import ScannerContext from '../context/ScannerContext';

const POS = () => {
    const { user } = useContext(AuthContext);
    const { setScanCallback, status: scannerStatus } = useContext(ScannerContext);
    const [batteries, setBatteries] = useState([]);
    const [cart, setCart] = useState([]);

    // Customer State
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [customerResults, setCustomerResults] = useState([]);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(-1);
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const customerSearchRef = useRef(null);
    const customerResultsRef = useRef(null);

    // Validation errors
    const [phoneError, setPhoneError] = useState('');
    const [idError, setIdError] = useState('');

    // Discount State
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState('amount');

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchRef = useRef(null);
    const resultsRef = useRef(null);

    // Item modal state
    const [showItemModal, setShowItemModal] = useState(false);
    const [selectedBattery, setSelectedBattery] = useState(null);
    const [itemQuantity, setItemQuantity] = useState(1);
    const [itemDiscount, setItemDiscount] = useState(0);
    const [itemDiscountType, setItemDiscountType] = useState('amount');
    const [overridePrice, setOverridePrice] = useState(0);

    // Dialog State
    const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

    // Print State
    const [completedSale, setCompletedSale] = useState(null);
    const [showPrintBill, setShowPrintBill] = useState(false);

    // Modal Field Refs for Keyboard Nav
    const priceRef = useRef(null);
    const qtyRef = useRef(null);
    const discountRef = useRef(null);
    const addBtnRef = useRef(null);

    // Loading States
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isProcessingSale, setIsProcessingSale] = useState(false);

    // Barcode Scanner State
    const [scannerBuffer, setScannerBuffer] = useState('');
    const [showScanIndicator, setShowScanIndicator] = useState(false);
    const scannerBufferRef = useRef('');
    const scannerTimeoutRef = useRef(null);
    const lastKeyTimeRef = useRef(0);

    // Global barcode scanner listener
    // USB barcode scanners type characters very fast (<50ms between keys) and end with Enter
    useEffect(() => {
        const handleScannerInput = (e) => {
            // Skip if a modal is open or user is typing in an input field
            const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
            
            // If the search input is focused, let the existing search handle it
            if (isInputFocused && document.activeElement !== document.body) {
                // But still detect fast scanner input in the search field
                const now = Date.now();
                const timeDiff = now - lastKeyTimeRef.current;
                lastKeyTimeRef.current = now;

                // Scanner types fast (< 50ms between chars)
                if (timeDiff < 50 && e.key.length === 1) {
                    scannerBufferRef.current += e.key;
                    clearTimeout(scannerTimeoutRef.current);
                    scannerTimeoutRef.current = setTimeout(() => {
                        scannerBufferRef.current = '';
                    }, 200);
                } else if (e.key === 'Enter' && scannerBufferRef.current.length >= 3) {
                    // Scanner finished — look up the barcode
                    e.preventDefault();
                    e.stopPropagation();
                    const scanned = scannerBufferRef.current;
                    scannerBufferRef.current = '';
                    lookupBarcode(scanned);
                } else if (timeDiff >= 50) {
                    scannerBufferRef.current = e.key.length === 1 ? e.key : '';
                }
                return;
            }

            // Global scanner detection (no input focused)
            const now = Date.now();
            const timeDiff = now - lastKeyTimeRef.current;
            lastKeyTimeRef.current = now;

            if (e.key.length === 1 && timeDiff < 50) {
                scannerBufferRef.current += e.key;
                setShowScanIndicator(true);
                clearTimeout(scannerTimeoutRef.current);
                scannerTimeoutRef.current = setTimeout(() => {
                    scannerBufferRef.current = '';
                    setShowScanIndicator(false);
                }, 200);
            } else if (e.key === 'Enter' && scannerBufferRef.current.length >= 3) {
                e.preventDefault();
                const scanned = scannerBufferRef.current;
                scannerBufferRef.current = '';
                setShowScanIndicator(false);
                lookupBarcode(scanned);
            } else if (e.key.length === 1) {
                // First char or slow typing — start fresh buffer
                scannerBufferRef.current = e.key;
                clearTimeout(scannerTimeoutRef.current);
                scannerTimeoutRef.current = setTimeout(() => {
                    scannerBufferRef.current = '';
                }, 200);
            }
        };

        document.addEventListener('keydown', handleScannerInput, true);
        return () => {
            document.removeEventListener('keydown', handleScannerInput, true);
            clearTimeout(scannerTimeoutRef.current);
        };
    }, [batteries, showItemModal]);

    // Register scan callback for phone scanner
    useEffect(() => {
        if (scannerStatus === 'connected') {
            setScanCallback((barcode) => lookupBarcode(barcode));
        }
    }, [scannerStatus, batteries, showItemModal]);

    const lookupBarcode = (barcode) => {
        if (showItemModal) return; // Don't open another modal if one is open
        const match = batteries.find(
            b => b.barcode && b.barcode.toLowerCase() === barcode.toLowerCase()
        );
        if (match) {
            openItemModal(match);
        } else {
            // Also try matching by serial number
            const snMatch = batteries.find(
                b => b.serialNumber.toLowerCase() === barcode.toLowerCase()
            );
            if (snMatch) {
                openItemModal(snMatch);
            } else {
                setDialog({
                    isOpen: true,
                    title: 'Barcode Not Found',
                    message: `No battery found with barcode or serial number: ${barcode}`,
                    type: 'warning'
                });
            }
        }
    };

    // Load persisted cart data on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('pos_cart');
        const savedCustomer = localStorage.getItem('pos_customer');
        const savedDiscount = localStorage.getItem('pos_discount');

        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error('Failed to load cart:', e);
            }
        }

        if (savedCustomer) {
            try {
                const customer = JSON.parse(savedCustomer);
                setCustomerName(customer.name || '');
                setCustomerPhone(customer.phone || '');
                setCustomerId(customer.id || '');
                setCustomerSearchTerm(customer.phone || '');
            } catch (e) {
                console.error('Failed to load customer:', e);
            }
        }

        if (savedDiscount) {
            try {
                const discountData = JSON.parse(savedDiscount);
                setDiscount(discountData.amount || 0);
                setDiscountType(discountData.type || 'amount');
            } catch (e) {
                console.error('Failed to load discount:', e);
            }
        }
    }, []);

    useEffect(() => {
        fetchBatteries();
    }, []);

    // Auto-focus Price when Modal Opens
    useEffect(() => {
        if (showItemModal && priceRef.current) {
            // Small timeout to ensure DOM is ready/animated
            setTimeout(() => {
                priceRef.current.focus();
                priceRef.current.select(); // Auto-select text for easy override
            }, 50);
        }
    }, [showItemModal]);

    // Filter batteries based on search term (Memoized-like)
    const filteredBatteries = searchTerm.trim().length >= 2
        ? batteries.filter(b => {
            const term = searchTerm.toLowerCase();
            return b.brand.toLowerCase().includes(term) ||
                b.model.toLowerCase().includes(term) ||
                b.serialNumber.toLowerCase().includes(term) ||
                (b.barcode && b.barcode.toLowerCase().includes(term));
        }).slice(0, 20)
        : [];

    // Keyboard Navigation for Search Dropdown
    const handleKeyDown = (e) => {
        if (!showDropdown || filteredBatteries.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < filteredBatteries.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < filteredBatteries.length) {
                openItemModal(filteredBatteries[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    // Keyboard Navigation for Modal Fields (Enter Key Behavior)
    const handlePriceKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            qtyRef.current?.focus();
            qtyRef.current?.select();
        }
    };

    const handleQtyKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            discountRef.current?.focus();
            discountRef.current?.select();
        }
    };

    const handleDiscountKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addBtnRef.current?.focus();
        }
    };

    useEffect(() => {
        if (selectedIndex >= 0 && resultsRef.current) {
            const selectedElement = resultsRef.current.children[selectedIndex];
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (cart.length > 0) {
            localStorage.setItem('pos_cart', JSON.stringify(cart));
        } else {
            localStorage.removeItem('pos_cart');
        }
    }, [cart]);

    // Save customer data to localStorage
    useEffect(() => {
        if (customerName || customerPhone || customerId) {
            localStorage.setItem('pos_customer', JSON.stringify({
                name: customerName,
                phone: customerPhone,
                id: customerId
            }));
        } else {
            localStorage.removeItem('pos_customer');
        }
    }, [customerName, customerPhone, customerId]);

    // Save discount to localStorage
    useEffect(() => {
        if (discount > 0) {
            localStorage.setItem('pos_discount', JSON.stringify({
                amount: discount,
                type: discountType
            }));
        } else {
            localStorage.removeItem('pos_discount');
        }
    }, [discount, discountType]);


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchBatteries = async () => {
        try {
            const res = await axios.get(API_ENDPOINTS.BATTERY, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setBatteries(res.data.filter(b => b.stockQuantity > 0));
        } catch (err) {
            console.error(err);
        }
    };

    const handleCustomerSearch = async (searchValue) => {
        setCustomerSearchTerm(searchValue);
        setIsNewCustomer(false);

        if (searchValue.length >= 3) {
            setShowCustomerDropdown(true);
            try {
                const res = await axios.get(`${API_ENDPOINTS.SALE}/customer/phone/${encodeURIComponent(searchValue)}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setCustomerResults(res.data);
                setSelectedCustomerIndex(0);
            } catch (err) {
                setCustomerResults([]);
                if (err.response?.status !== 404) {
                    console.error('Error searching customers:', err);
                }
            }
        } else {
            setShowCustomerDropdown(false);
            setCustomerResults([]);
        }
    };

    const handleCustomerKeyDown = (e) => {
        if (!showCustomerDropdown || customerResults.length === 0) {
            if (e.key === 'Enter' && customerSearchTerm.length >= 3) {
                selectNewCustomer();
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedCustomerIndex(prev => (prev < customerResults.length ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedCustomerIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedCustomerIndex === customerResults.length) {
                selectNewCustomer();
            } else if (selectedCustomerIndex >= 0 && selectedCustomerIndex < customerResults.length) {
                selectCustomer(customerResults[selectedCustomerIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowCustomerDropdown(false);
        }
    };

    const selectCustomer = (customer) => {
        setCustomerId(customer.customerId || '');
        setCustomerName(customer.customerName);
        setCustomerPhone(customer.customerPhone);
        setCustomerSearchTerm(customer.customerPhone);
        setShowCustomerDropdown(false);
        setIsNewCustomer(false);
    };

    const selectNewCustomer = () => {
        setCustomerId('');
        setCustomerName('');
        setCustomerPhone(customerSearchTerm);
        setShowCustomerDropdown(false);
        setIsNewCustomer(true);
    };

    useEffect(() => {
        if (selectedCustomerIndex >= 0 && customerResultsRef.current) {
            const selectedElement = customerResultsRef.current.children[selectedCustomerIndex];
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedCustomerIndex]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (customerSearchRef.current && !customerSearchRef.current.contains(event.target)) {
                setShowCustomerDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const openItemModal = (battery) => {
        setSelectedBattery(battery);
        setItemQuantity(1);
        setItemDiscount(0);
        setItemDiscountType('amount');
        setOverridePrice(battery.sellingPrice);
        setShowItemModal(true);
        setSearchTerm('');
        setShowDropdown(false);
        setSelectedIndex(-1);
    };

    const closeItemModal = () => {
        setShowItemModal(false);
        setSelectedBattery(null);
    };

    const calculateItemDiscount = () => {
        if (!selectedBattery) return 0;
        const price = parseFloat(overridePrice) || 0;
        const subtotal = price * itemQuantity;
        if (itemDiscountType === 'percentage') {
            return (subtotal * itemDiscount) / 100;
        }
        return itemDiscount;
    };

    const addItemToCart = () => {
        if (!selectedBattery) return;

        if (itemQuantity > selectedBattery.stockQuantity) {
            setDialog({ isOpen: true, title: 'Stock Limit', message: 'Cannot add more than available stock', type: 'warning' });
            return;
        }

        const finalPrice = parseFloat(overridePrice);
        if (isNaN(finalPrice) || finalPrice < 0) {
            setDialog({ isOpen: true, title: 'Invalid Price', message: 'Please enter a valid price', type: 'error' });
            return;
        }

        const discountAmount = calculateItemDiscount();

        setCart([...cart, {
            batteryId: selectedBattery.id,
            brand: selectedBattery.brand,
            model: selectedBattery.model,
            serialNumber: selectedBattery.serialNumber,
            unitPrice: finalPrice,
            quantity: itemQuantity,
            itemDiscount: discountAmount,
            maxStock: selectedBattery.stockQuantity,
            capacity: selectedBattery.capacity,
            voltage: selectedBattery.voltage
        }]);

        closeItemModal();
    };

    const removeFromCart = (index) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const calculateSubtotal = () => {
        return cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    };

    const calculateItemDiscounts = () => {
        return cart.reduce((sum, item) => sum + (item.itemDiscount || 0), 0);
    };

    const calculateOverallDiscount = () => {
        if (discountType === 'percentage') {
            return ((calculateSubtotal() - calculateItemDiscounts()) * discount) / 100;
        }
        return discount;
    };

    const calculateTotal = () => {
        return Math.max(0, calculateSubtotal() - calculateItemDiscounts() - calculateOverallDiscount());
    };

    // Validate stock before checkout
    const validateStock = async () => {
        try {
            const res = await axios.get(API_ENDPOINTS.BATTERY, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const currentStock = res.data;
            const stockMap = {};
            currentStock.forEach(b => { stockMap[b.id] = b.stockQuantity; });

            const outOfStockItems = [];
            for (const item of cart) {
                const currentQty = stockMap[item.batteryId] || 0;
                if (currentQty < item.quantity) {
                    outOfStockItems.push({
                        name: `${item.brand} ${item.model}`,
                        requested: item.quantity,
                        available: currentQty
                    });
                }
            }

            return outOfStockItems;
        } catch (err) {
            // If stock check fails, proceed but log error
            if (process.env.NODE_ENV === 'development') {
                console.error('Stock validation error:', err);
            }
            return [];
        }
    };

    const handleCheckout = async () => {
        // Validate phone number
        const phoneValidationError = customerPhone ? (/^0\d{9}$/.test(customerPhone) ? '' : 'Phone must be 10 digits starting with 0') : 'Phone number is required';
        setPhoneError(phoneValidationError);

        // Validate ID (optional field) - supports multiple formats
        // Sri Lankan NIC: 12 digits OR 9 digits + V/v
        // Passport: 6-20 alphanumeric characters
        const idValidationError = customerId 
            ? ((/^\d{12}$/.test(customerId) || /^\d{9}[vVxX]$/.test(customerId) || /^[A-Za-z0-9]{6,20}$/.test(customerId)) 
                ? '' 
                : 'ID must be valid NIC (12 digits or 9 digits + V) or passport (6-20 alphanumeric)') 
            : '';
        setIdError(idValidationError);

        if (!customerName || !customerPhone) {
            setDialog({ isOpen: true, title: 'Missing Details', message: 'Please enter customer name and phone number', type: 'warning' });
            return;
        }

        if (phoneValidationError || idValidationError) {
            setDialog({ isOpen: true, title: 'Validation Error', message: phoneValidationError || idValidationError, type: 'warning' });
            return;
        }

        if (cart.length === 0) {
            setDialog({ isOpen: true, title: 'Empty Cart', message: 'Please add items to cart before checkout', type: 'warning' });
            return;
        }

        if (isProcessingSale) return;

        // Validate stock before processing
        setIsProcessingSale(true);
        const outOfStockItems = await validateStock();
        
        if (outOfStockItems.length > 0) {
            const itemList = outOfStockItems.map(i => 
                `• ${i.name}: Requested ${i.requested}, Available ${i.available}`
            ).join('\n');
            setDialog({ 
                isOpen: true, 
                title: 'Insufficient Stock', 
                message: `The following items have insufficient stock:\n\n${itemList}\n\nPlease update the cart and try again.`, 
                type: 'error' 
            });
            setIsProcessingSale(false);
            return;
        }

        try {
            const payload = {
                customerName,
                customerPhone,
                customerId,
                discount: calculateItemDiscounts() + calculateOverallDiscount(),
                items: cart.map(item => ({
                    batteryId: item.batteryId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice
                }))
            };

            const response = await axios.post(API_ENDPOINTS.SALE, payload, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            // Store minimal data - prepare full print data only when printing
            const saleId = response.data.id || response.data._id;

            setCompletedSale({
                ...payload,
                id: saleId,
                invoiceNumber: response.data.invoiceNumber,
                date: new Date().toISOString(),
                totalAmount: calculateTotal(),
                cashierName: user.username,
                items: cart
            });

            // Clear cart immediately before showing print
            const cartItems = [...cart];
            setCart([]);
            setCustomerName('');
            setCustomerPhone('');
            setCustomerId('');
            setDiscount(0);
            setDiscountType('amount');

            // Show print dialog
            setShowPrintBill(true);
        } catch (err) {
            console.error(err);
            setDialog({ isOpen: true, title: 'Error', message: err.response?.data?.message || 'Error processing sale', type: 'error' });
        } finally {
            setIsProcessingSale(false);
        }
    };

    const clearCart = () => {
        if (cart.length > 0) {
            setDialog({
                isOpen: true,
                title: 'Clear Cart',
                message: 'Are you sure you want to clear all items from the cart?',
                type: 'confirm',
                onConfirm: () => setCart([])
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
            {/* Barcode Scan Indicator Overlay */}
            {showScanIndicator && (
                <div className="fixed top-4 right-4 z-[9999] bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-pulse">
                    <ScanBarcode size={20} />
                    <span className="font-medium">Scanning...</span>
                </div>
            )}

            <div className="flex-1 max-w-6xl mx-auto w-full p-4 lg:p-6 space-y-6">

                {/* 1. TOP BAR */}
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg">
                                <ShoppingCart size={24} />
                            </div>
                            New Sale
                        </h1>
                    </div>
                </div>

                {/* 2. SEARCH BAR & RESULTS */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-400 relative z-30" ref={searchRef}>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-gray-700">Search Products</label>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            <ScanBarcode size={14} className="text-blue-500" />
                            Barcode scanner ready
                        </span>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
                        <input
                            type="text"
                            placeholder="Scan or type brand, model, serial number..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowDropdown(e.target.value.length >= 2);
                                setSelectedIndex(0);
                            }}
                            onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
                            onKeyDown={handleKeyDown}
                            className="w-full pl-12 pr-4 py-4 bg-white border-3 border-gray-400 rounded-xl focus:border-blue-600 focus:border-3 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none text-xl font-medium transition-all"
                            autoFocus
                        />
                        {showDropdown && filteredBatteries.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-400 max-h-[400px] overflow-y-auto z-50">
                                <ul className="py-2" ref={resultsRef}>
                                    {filteredBatteries.map((battery, index) => (
                                        <li
                                            key={battery.id}
                                            onClick={() => openItemModal(battery)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={`px-4 py-3 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors flex justify-between items-center ${index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${index === selectedIndex ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                                    <Battery size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{battery.brand} {battery.model}</div>
                                                    <div className="text-xs text-gray-500 font-mono">SN: {battery.serialNumber}</div>
                                                    {battery.barcode && <div className="text-xs text-gray-400 font-mono">BC: {battery.barcode}</div>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-blue-600">LKR {battery.sellingPrice.toLocaleString()}</div>
                                                <div className="text-xs text-gray-500">Stock: {battery.stockQuantity}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. CART (Vertical Layout) */}
                <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-400 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <ShoppingCart size={20} className="text-blue-600" />
                            Current Order
                        </h2>
                        {cart.length > 0 && (
                            <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors">
                                Clear Cart
                            </button>
                        )}
                    </div>

                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white border-b border-gray-100 text-xs text-gray-500 uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Product Details</th>
                                    <th className="px-6 py-4 text-center">Qty</th>
                                    <th className="px-6 py-4 text-right">Unit Price</th>
                                    <th className="px-6 py-4 text-right">Discount</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                    <th className="px-6 py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {cart.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                                    <Search size={32} opacity={0.3} />
                                                </div>
                                                <p>Search for items to add to cart</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    cart.map((item, index) => (
                                        <tr key={index} className="hover:bg-white transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{item.brand} {item.model}</div>
                                                <div className="text-xs text-gray-500 font-mono">SN: {item.serialNumber}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-gray-700">
                                                {item.quantity}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-600">
                                                LKR {item.unitPrice.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right text-green-600 font-medium">
                                                {item.itemDiscount > 0 ? `- ${item.itemDiscount.toLocaleString()}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-900 text-lg">
                                                {((item.unitPrice * item.quantity) - (item.itemDiscount || 0)).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={() => removeFromCart(index)} className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* CUSTOMER INFO & CHECKOUT (Bottom) */}
                    <div className="bg-gray-50 border-t border-gray-200 p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* CUSTOMER DETAILS */}
                            <div className="space-y-4">
                                <div className="relative" ref={customerSearchRef}>
                                    <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Customer Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="tel"
                                            value={customerSearchTerm}
                                            onChange={(e) => handleCustomerSearch(e.target.value)}
                                            onKeyDown={handleCustomerKeyDown}
                                            onFocus={() => customerSearchTerm.length >= 3 && setShowCustomerDropdown(true)}
                                            placeholder="Enter Phone Number (Min 3 digits) *"
                                            className="w-full pl-10 pr-4 py-3 bg-white border-3 border-gray-400 rounded-xl focus:border-blue-600 focus:border-3 focus:bg-white outline-none transition-all"
                                            autoFocus={cart.length > 0}
                                        />
                                    </div>
                                    {showCustomerDropdown && (customerResults.length > 0 || customerSearchTerm.length >= 3) && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-400 max-h-[300px] overflow-y-auto z-50">
                                            <ul className="py-2" ref={customerResultsRef}>
                                                {customerResults.map((customer, index) => (
                                                    <li
                                                        key={customer.customerPhone}
                                                        onClick={() => selectCustomer(customer)}
                                                        onMouseEnter={() => setSelectedCustomerIndex(index)}
                                                        className={`px-4 py-3 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors ${index === selectedCustomerIndex ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                                    >
                                                        <div className="font-bold text-gray-800">{customer.customerName}</div>
                                                        <div className="text-sm text-gray-600">Phone: {customer.customerPhone}</div>
                                                        {customer.customerId && <div className="text-xs text-gray-400">ID: {customer.customerId}</div>}
                                                    </li>
                                                ))}
                                                {customerSearchTerm.length >= 3 && (
                                                    <li
                                                        onClick={selectNewCustomer}
                                                        onMouseEnter={() => setSelectedCustomerIndex(customerResults.length)}
                                                        className={`px-4 py-3 cursor-pointer border-t-2 border-blue-100 transition-colors ${selectedCustomerIndex === customerResults.length ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                                                    >
                                                        <div className="font-bold text-green-600 flex items-center gap-2">
                                                            <Plus size={16} /> Create New Customer: {customerSearchTerm}
                                                        </div>
                                                        <div className="text-xs text-gray-500">Press Enter to create new customer record</div>
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Show customer details after selection */}
                                {(customerPhone || isNewCustomer) && (
                                    <div className="space-y-3 pt-3 border-t border-gray-200">
                                        <input
                                            type="text"
                                            value={customerId}
                                            onChange={(e) => {
                                                setCustomerId(e.target.value);
                                                // Validate on change - supports NIC and passport formats
                                                const val = e.target.value;
                                                if (val && !/^\d{12}$/.test(val) && !/^\d{9}[vVxX]$/.test(val) && !/^[A-Za-z0-9]{6,20}$/.test(val)) {
                                                    setIdError('ID must be valid NIC or passport');
                                                } else {
                                                    setIdError('');
                                                }
                                            }}
                                            placeholder="Customer ID (NIC / Passport)"
                                            className={`w-full px-4 py-3 bg-white rounded-lg outline-none transition-colors ${idError ? 'border-3 border-red-500' : 'border-2 border-gray-400 focus:border-blue-600 focus:border-3'
                                                }`}
                                            disabled={!isNewCustomer}
                                        />
                                        {idError && <p className="text-red-500 text-xs mt-1">{idError}</p>}
                                        <input
                                            type="text"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            placeholder="Customer Name *"
                                            className="w-full px-4 py-3 bg-white border-2 border-gray-400 rounded-lg focus:border-blue-600 focus:border-3 outline-none transition-colors"
                                            disabled={!isNewCustomer}
                                        />
                                        {isNewCustomer && (
                                            <div className="text-sm text-green-600 font-medium">
                                                ✨ New customer - Fill in details
                                            </div>
                                        )}
                                        {!isNewCustomer && customerPhone && (
                                            <div className="text-sm text-blue-600 font-medium flex items-center justify-between">
                                                <span>✅ Existing customer loaded</span>
                                                <button
                                                    onClick={() => {
                                                        setCustomerId('');
                                                        setCustomerName('');
                                                        setCustomerPhone('');
                                                        setCustomerSearchTerm('');
                                                        setIsNewCustomer(false);
                                                    }}
                                                    className="text-red-600 hover:text-red-700 text-xs font-medium"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* TOTALS & ACTION */}
                            <div className="flex flex-col justify-between space-y-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-gray-500 uppercase">Extra Discount</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                value={discount}
                                                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                                className="w-32 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:border-3 font-medium text-right"
                                            />
                                            <select
                                                value={discountType}
                                                onChange={(e) => setDiscountType(e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white font-medium text-gray-700"
                                            >
                                                <option value="amount">LKR</option>
                                                <option value="percentage">%</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                        <div className="text-gray-500 font-medium">Grand Total</div>
                                        <div className="text-4xl font-extrabold text-blue-600">
                                            LKR {calculateTotal().toLocaleString()}
                                        </div>
                                    </div>
                                    {(calculateItemDiscounts() + calculateOverallDiscount()) > 0 && (
                                        <div className="text-right text-sm text-green-600 font-bold">
                                            Total Savings: LKR {(calculateItemDiscounts() + calculateOverallDiscount()).toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0 || !customerName || !customerPhone || isProcessingSale}
                                    className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed mt-auto"
                                >
                                    {isProcessingSale ? (
                                        <>
                                            <Loader2 size={24} className="animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={24} /> Confirm Sale
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            {/* MODAL: ADD ITEM */}
            {
                showItemModal && selectedBattery && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="bg-gray-50 p-6 border-b border-gray-100">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-2xl font-extrabold text-gray-900 break-words max-w-[85%]">{selectedBattery.brand} {selectedBattery.model}</h3>
                                    <button onClick={closeItemModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                                        <X size={28} />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">Serial No</span>
                                        <span className="font-mono text-lg font-bold text-gray-800 bg-white px-2 py-1 rounded border-2 border-gray-400">
                                            {selectedBattery.serialNumber}
                                        </span>
                                    </div>
                                    {selectedBattery.barcode && (
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">Barcode</span>
                                            <span className="font-mono text-lg font-bold text-gray-800 bg-white px-2 py-1 rounded border-2 border-gray-400">
                                                {selectedBattery.barcode}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
                                        <span className="flex items-center gap-1"><Battery size={16} /> {selectedBattery.capacity}Ah</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Override Price Input */}
                                <div>
                                    <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <Edit2 size={12} /> Unit Price (Editable)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">LKR</span>
                                        <input
                                            type="number"
                                            ref={priceRef}
                                            onKeyDown={handlePriceKeyDown}
                                            value={overridePrice}
                                            onChange={(e) => setOverridePrice(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-blue-50/50 border-3 border-gray-400 rounded-xl focus:border-blue-600 focus:border-3 focus:bg-white outline-none font-bold text-xl text-gray-900 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Quantity Input */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quantity</label>
                                    <div className="flex h-12 bg-gray-100 rounded-xl p-1">
                                        <button onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))} className="w-14 h-full bg-white rounded-lg shadow-sm text-gray-600 hover:text-blue-600 flex items-center justify-center transition-all"><Minus size={20} /></button>
                                        <input
                                            type="number"
                                            ref={qtyRef}
                                            onKeyDown={handleQtyKeyDown}
                                            className="flex-1 bg-transparent text-center font-bold text-xl text-gray-800 outline-none"
                                            value={itemQuantity}
                                            onChange={(e) => setItemQuantity(Math.max(1, Math.min(selectedBattery.stockQuantity, parseInt(e.target.value) || 1)))}
                                        />
                                        <button onClick={() => setItemQuantity(Math.min(selectedBattery.stockQuantity, itemQuantity + 1))} className="w-14 h-full bg-white rounded-lg shadow-sm text-gray-600 hover:text-blue-600 flex items-center justify-center transition-all"><Plus size={20} /></button>
                                    </div>
                                </div>

                                {/* Discount Input */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Item Discount</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                ref={discountRef}
                                                onKeyDown={handleDiscountKeyDown}
                                                value={itemDiscount}
                                                onChange={(e) => setItemDiscount(parseFloat(e.target.value) || 0)}
                                                className="w-full pl-3 pr-3 py-3 border-2 border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-lg"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="flex bg-gray-100 p-1 rounded-xl">
                                            <button onClick={() => setItemDiscountType('amount')} className={`px-4 rounded-lg text-sm font-bold transition-all ${itemDiscountType === 'amount' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>LKR</button>
                                            <button onClick={() => setItemDiscountType('percentage')} className={`px-4 rounded-lg text-sm font-bold transition-all ${itemDiscountType === 'percentage' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>%</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <span className="text-gray-500 font-medium">Total Price</span>
                                    <span className="text-3xl font-extrabold text-blue-600">
                                        LKR {((parseFloat(overridePrice) * itemQuantity) - calculateItemDiscount()).toLocaleString()}
                                    </span>
                                </div>
                                <button
                                    onClick={addItemToCart}
                                    ref={addBtnRef}
                                    disabled={isAddingToCart}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transaction-all flex items-center justify-center gap-2 text-lg focus:ring-4 focus:ring-blue-300 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isAddingToCart ? (
                                        <>
                                            <Loader2 size={24} className="animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            Add to Cart <ChevronRight size={24} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Dialog Component */}
            <Dialog
                isOpen={dialog.isOpen}
                onClose={() => setDialog({ ...dialog, isOpen: false })}
                title={dialog.title}
                message={dialog.message}
                type={dialog.type}
                onConfirm={dialog.onConfirm}
            />

            {/* Print Bill Component */}
            {
                showPrintBill && completedSale && (
                    <PrintableBill
                        saleData={completedSale}
                        showPreview={true}
                        onClose={() => {
                            setShowPrintBill(false);
                            setCompletedSale(null);
                        }}
                    />
                )
            }

        </div >
    );
};

export default POS;
