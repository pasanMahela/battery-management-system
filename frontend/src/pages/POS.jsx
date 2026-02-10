import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Dialog from '../components/Dialog';
import PrintableBill from '../components/PrintableBill';
import { ShoppingCart, Trash2, Search, Plus, Minus, CheckCircle, Battery, User, Phone, Edit2, X, ChevronRight, Filter, Loader2, ScanBarcode } from 'lucide-react';
import { API_ENDPOINTS } from '../constants/constants';
import ScannerContext from '../context/ScannerContext';
import PageHeader from '../components/PageHeader';

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
    const [paidAmount, setPaidAmount] = useState('');

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchRef = useRef(null);
    const resultsRef = useRef(null);
    const searchInputRef = useRef(null);

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

    // Sale Date State
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);

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
        // Focus price field after item is selected
        setTimeout(() => {
            if (priceRef.current) priceRef.current.focus();
        }, 50);
    };

    const closeItemModal = () => {
        setShowItemModal(false);
        setSelectedBattery(null);
        setSearchTerm('');
        // Focus back to search input
        setTimeout(() => {
            if (searchInputRef.current) searchInputRef.current.focus();
        }, 50);
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

        // Check already-in-cart quantity for this battery
        const alreadyInCart = cart
            .filter(item => item.batteryId === selectedBattery.id)
            .reduce((sum, item) => sum + item.quantity, 0);
        const remainingStock = selectedBattery.stockQuantity - alreadyInCart;

        if (itemQuantity > remainingStock) {
            setDialog({ isOpen: true, title: 'Stock Limit', message: `Cannot add more than available stock. Already in cart: ${alreadyInCart}, Remaining: ${remainingStock}`, type: 'warning' });
            closeItemModal();
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
                paidAmount: paidAmount ? parseFloat(paidAmount) : null,
                balance: paidAmount ? parseFloat(paidAmount) - calculateTotal() : null,
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
                date: new Date(saleDate + 'T00:00:00').toISOString(),
                totalAmount: calculateTotal(),
                cashierName: user.username,
                paidAmount: paidAmount ? parseFloat(paidAmount) : null,
                balance: paidAmount ? parseFloat(paidAmount) - calculateTotal() : null,
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
            setPaidAmount('');

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
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-gray-800">
            {/* Barcode Scan Indicator Overlay */}
            {showScanIndicator && (
                <div className="fixed top-4 right-4 z-[9999] bg-green-600 text-white px-4 py-3 rounded shadow-lg flex items-center gap-2 animate-pulse">
                    <ScanBarcode size={20} />
                    <span className="font-medium">Scanning...</span>
                </div>
            )}

            <div className="w-full max-w-[1400px] mx-auto p-2 sm:p-3 space-y-3">

                {/* TITLE BAR */}
                <PageHeader title="Point of Sale (POS) Interface" />

                {/* SEARCH SECTION */}
                <div className="bg-white border border-gray-300 p-2 sm:p-3 rounded shadow-sm" ref={searchRef}>
                    {/* Row 1: Search */}
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="font-bold text-sm whitespace-nowrap">Item Code:</label>
                        <div className="relative flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Scan or type brand, model, serial..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowDropdown(e.target.value.length >= 2);
                                    setSelectedIndex(0);
                                }}
                                onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
                                onKeyDown={handleKeyDown}
                                ref={searchInputRef}
                                className="w-full px-3 py-1.5 border-2 border-gray-400 rounded text-sm font-medium outline-none focus:border-blue-600 transition-colors"
                                autoFocus
                            />
                        </div>
                        <button
                            onClick={() => searchTerm.length >= 2 && setShowDropdown(true)}
                            className="px-4 py-1.5 bg-gray-200 border-2 border-gray-400 rounded font-bold text-sm hover:bg-gray-300 transition-colors"
                        >
                            Find
                        </button>
                        {selectedBattery && (
                            <span className="text-xs text-gray-600 ml-1 whitespace-nowrap">
                                Current Stock: <strong>{Math.max(0, selectedBattery.stockQuantity - cart.filter(c => c.batteryId === selectedBattery.id).reduce((s, c) => s + c.quantity, 0)).toFixed(2)}</strong>
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 ml-auto">
                            <ScanBarcode size={14} className="text-blue-500" />
                            Barcode scanner ready
                        </span>
                    </div>

                    {/* Search Dropdown */}
                    {showDropdown && filteredBatteries.length > 0 && (
                        <div className="relative">
                            <div className="absolute top-1 left-0 right-0 bg-white rounded border-2 border-gray-400 shadow-xl max-h-[350px] overflow-y-auto z-50">
                                <ul ref={resultsRef}>
                                    {filteredBatteries.map((battery, index) => (
                                        <li
                                            key={battery.id}
                                            onClick={() => openItemModal(battery)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={`px-3 py-2 cursor-pointer border-b border-gray-200 flex justify-between items-center text-sm ${index === selectedIndex ? 'bg-[#90EE90]' : 'hover:bg-gray-100'}`}
                                        >
                                            <div>
                                                <span className="font-bold">{battery.brand} {battery.model}</span>
                                                <span className="text-gray-500 ml-2 font-mono text-xs">SN: {battery.serialNumber}</span>
                                                {battery.barcode && <span className="text-gray-400 ml-2 font-mono text-xs">BC: {battery.barcode}</span>}
                                            </div>
                                            <div className="text-right whitespace-nowrap">
                                                <span className="font-bold text-[#2563eb]">Rs. {battery.sellingPrice.toLocaleString()}</span>
                                                <span className="text-xs text-gray-500 ml-3">Stock: {battery.stockQuantity}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Row 2: Selected Item Inline Fields (always visible) */}
                    <div className="mt-2 pt-2 border-t border-gray-200" style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 60px 24px 120px 80px 65px 56px', gap: '4px', alignItems: 'center' }}>
                        {/* Labels */}
                        <span className="text-xs font-bold">Item Name:</span>
                        <span className="text-xs font-bold">SN:</span>
                        <span className="text-xs font-bold">Price:</span>
                        <span className="text-xs font-bold">Qty:</span>
                        <span></span>
                        <span className="text-xs font-bold">Total Price:</span>
                        <span className="text-xs font-bold">Disc. Rs.</span>
                        <span className="text-xs font-bold">Disc. %</span>
                        <span></span>
                        {/* Inputs */}
                        <input type="text" readOnly value={selectedBattery ? `${selectedBattery.brand} ${selectedBattery.model}` : ''} className="w-full px-2 py-1.5 border border-gray-400 rounded text-xs font-bold bg-gray-50" />
                        <input type="text" readOnly value={selectedBattery ? selectedBattery.serialNumber : ''} placeholder="SN" className="w-full px-2 py-1.5 border border-gray-400 rounded text-xs font-mono bg-gray-50" />
                        <input
                            type="number"
                            ref={priceRef}
                            onKeyDown={handlePriceKeyDown}
                            value={overridePrice}
                            onChange={(e) => setOverridePrice(e.target.value)}
                            disabled={!selectedBattery}
                            className="w-full px-2 py-1.5 border-2 border-gray-400 rounded text-xs font-bold text-right outline-none focus:border-blue-600 disabled:bg-gray-100"
                        />
                        <input
                            type="number"
                            ref={qtyRef}
                            onKeyDown={handleQtyKeyDown}
                            value={itemQuantity}
                            onChange={(e) => setItemQuantity(Math.max(1, Math.min(selectedBattery ? selectedBattery.stockQuantity : 1, parseInt(e.target.value) || 1)))}
                            disabled={!selectedBattery}
                            className="w-full px-2 py-1.5 border-2 border-gray-400 rounded text-xs font-bold text-center outline-none focus:border-blue-600 disabled:bg-gray-100"
                        />
                        <button
                            onClick={() => selectedBattery && setItemQuantity(Math.min(selectedBattery.stockQuantity, itemQuantity + 1))}
                            disabled={!selectedBattery}
                            className="w-full py-1.5 border border-gray-400 rounded bg-gray-200 hover:bg-gray-300 text-xs font-bold disabled:opacity-50 text-center"
                        >&gt;</button>
                        <div className="flex items-center gap-0.5">
                            <span className="text-xs font-bold">Rs.</span>
                            <input type="text" readOnly value={selectedBattery ? ((parseFloat(overridePrice) || 0) * itemQuantity).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'} className="flex-1 min-w-0 px-1 py-1.5 border border-gray-400 rounded text-xs font-bold text-right bg-gray-50" />
                        </div>
                        <input
                            type="number"
                            ref={discountRef}
                            onKeyDown={handleDiscountKeyDown}
                            value={itemDiscount}
                            onChange={(e) => setItemDiscount(parseFloat(e.target.value) || 0)}
                            disabled={!selectedBattery}
                            className="w-full px-2 py-1.5 border-2 border-gray-400 rounded text-xs font-medium text-right outline-none focus:border-blue-600 disabled:bg-gray-100"
                            placeholder="0.00"
                        />
                        <input
                            type="number"
                            value={itemDiscountType === 'percentage' ? itemDiscount : 0}
                            onChange={(e) => {
                                setItemDiscountType('percentage');
                                setItemDiscount(parseFloat(e.target.value) || 0);
                            }}
                            disabled={!selectedBattery}
                            className="w-full px-2 py-1.5 border-2 border-gray-400 rounded text-xs font-medium text-right outline-none focus:border-blue-600 disabled:bg-gray-100"
                            placeholder="0.00"
                        />
                        <button
                            onClick={addItemToCart}
                            ref={addBtnRef}
                            disabled={!selectedBattery || isAddingToCart}
                            className="w-full py-1.5 border-2 border-gray-400 bg-gray-200 hover:bg-gray-300 rounded font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAddingToCart ? '...' : 'Add'}
                        </button>
                    </div>
                </div>

                {/* CART TABLE */}
                <div className="bg-white border border-gray-300 rounded shadow-sm overflow-x-auto">
                    {/* Table Header */}
                    <table className="w-full text-sm border-collapse" style={{ minWidth: '700px' }}>
                        <thead>
                            <tr className="bg-[#2563eb] text-white text-left">
                                <th className="px-3 py-2 font-bold border-r border-blue-400/30">Item Code</th>
                                <th className="px-3 py-2 font-bold border-r border-blue-400/30">Item Name</th>
                                <th className="px-3 py-2 font-bold border-r border-blue-400/30 text-right">Price Rs.</th>
                                <th className="px-3 py-2 font-bold border-r border-blue-400/30 text-center">Qty</th>
                                <th className="px-3 py-2 font-bold border-r border-blue-400/30 text-right">Discount Rs.</th>
                                <th className="px-3 py-2 font-bold border-r border-blue-400/30 text-right">Total Price Rs.</th>
                                <th className="px-3 py-2 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-gray-400 bg-blue-50">
                                        Search for items to add to cart
                                    </td>
                                </tr>
                            ) : (
                                cart.map((item, index) => (
                                    <tr key={index} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-blue-50' : 'bg-blue-100/40'}`}>
                                        <td className="px-3 py-2 font-mono text-xs border-r border-gray-300">{item.serialNumber}</td>
                                        <td className="px-3 py-2 font-bold border-r border-gray-300">{item.brand} {item.model}</td>
                                        <td className="px-3 py-2 text-right font-medium border-r border-gray-300">{item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-3 py-2 text-center font-bold border-r border-gray-300">{item.quantity.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-right border-r border-gray-300">{(item.itemDiscount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-3 py-2 text-right font-bold border-r border-gray-300">{((item.unitPrice * item.quantity) - (item.itemDiscount || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-3 py-2 text-center">
                                            <button onClick={() => removeFromCart(index)} className="text-blue-700 hover:text-red-600 underline text-xs font-medium">
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}

                            {/* SUMMARY ROWS */}
                            <tr className="bg-blue-50 border-t-2 border-gray-300">
                                <td colSpan="5" className="px-3 py-2 text-right font-bold border-r border-gray-300">Gross Value Rs.</td>
                                <td className="px-3 py-2 text-right font-bold border-r border-gray-300">{calculateSubtotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                <td></td>
                            </tr>
                            <tr className="bg-blue-100/40">
                                <td colSpan="5" className="px-3 py-2 text-right font-bold border-r border-gray-300">Deductions Rs.</td>
                                <td className="px-3 py-1 text-right border-r border-gray-300">
                                    <div className="flex items-center justify-end gap-1">
                                        <input
                                            type="number"
                                            min="0"
                                            value={discount}
                                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                            className="w-24 px-2 py-1 border border-gray-400 rounded text-right text-sm font-medium outline-none focus:border-blue-600"
                                        />
                                        <select
                                            value={discountType}
                                            onChange={(e) => setDiscountType(e.target.value)}
                                            className="px-1 py-1 border border-gray-400 rounded text-xs outline-none bg-white"
                                        >
                                            <option value="amount">Rs</option>
                                            <option value="percentage">%</option>
                                        </select>
                                    </div>
                                </td>
                                <td></td>
                            </tr>
                            <tr className="bg-blue-50">
                                <td colSpan="5" className="px-3 py-2 text-right font-bold border-r border-gray-300">Net Value Rs.</td>
                                <td className="px-3 py-2 text-right font-extrabold text-lg border-r border-gray-300">{calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                <td></td>
                            </tr>
                            <tr className="bg-blue-100/40">
                                <td colSpan="5" className="px-3 py-2 text-right font-bold border-r border-gray-300">Paid Amount Rs.</td>
                                <td className="px-3 py-1 text-right border-r border-gray-300">
                                    <input
                                        type="number"
                                        min="0"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full px-2 py-1 border border-gray-400 rounded text-right text-sm font-medium outline-none focus:border-blue-600"
                                    />
                                </td>
                                <td></td>
                            </tr>
                            <tr className="bg-blue-50">
                                <td colSpan="5" className="px-3 py-2 text-right font-bold border-r border-gray-300">Balance Rs.</td>
                                <td className={`px-3 py-2 text-right font-extrabold text-lg border-r border-gray-300 ${
                                    paidAmount && (parseFloat(paidAmount) - calculateTotal()) < 0 ? 'text-red-600' : 'text-green-700'
                                }`}>
                                    {paidAmount ? (parseFloat(paidAmount) - calculateTotal()).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                                </td>
                                <td></td>
                            </tr>

                            {/* CUSTOMER & CHECKOUT ROWS */}
                            <tr className="bg-blue-100/40">
                                <td colSpan="5" className="px-3 py-2 text-right font-bold border-r border-gray-300">Customer Phone:</td>
                                <td className="px-3 py-1 border-r border-gray-300" colSpan="2">
                                    <div className="relative" ref={customerSearchRef}>
                                        <input
                                            type="tel"
                                            value={customerSearchTerm}
                                            onChange={(e) => handleCustomerSearch(e.target.value)}
                                            onKeyDown={handleCustomerKeyDown}
                                            onFocus={() => customerSearchTerm.length >= 3 && setShowCustomerDropdown(true)}
                                            placeholder="Enter Phone *"
                                            className={`w-full px-2 py-1 border rounded text-sm outline-none ${phoneError ? 'border-red-500' : 'border-gray-400 focus:border-blue-600'}`}
                                        />
                                        {phoneError && <p className="text-red-500 text-[10px] mt-0.5">{phoneError}</p>}
                                        {showCustomerDropdown && (customerResults.length > 0 || customerSearchTerm.length >= 3) && (
                                            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded border-2 border-gray-400 shadow-xl max-h-[200px] overflow-y-auto z-50">
                                                <ul ref={customerResultsRef}>
                                                    {customerResults.map((customer, index) => (
                                                        <li
                                                            key={customer.customerPhone}
                                                            onClick={() => selectCustomer(customer)}
                                                            onMouseEnter={() => setSelectedCustomerIndex(index)}
                                                            className={`px-3 py-2 cursor-pointer border-b border-gray-200 text-sm ${index === selectedCustomerIndex ? 'bg-[#90EE90]' : 'hover:bg-gray-100'}`}
                                                        >
                                                            <div className="font-bold">{customer.customerName}</div>
                                                            <div className="text-xs text-gray-600">{customer.customerPhone}</div>
                                                        </li>
                                                    ))}
                                                    {customerSearchTerm.length >= 3 && (
                                                        <li
                                                            onClick={selectNewCustomer}
                                                            onMouseEnter={() => setSelectedCustomerIndex(customerResults.length)}
                                                            className={`px-3 py-2 cursor-pointer border-t-2 border-blue-200 text-sm ${selectedCustomerIndex === customerResults.length ? 'bg-[#90EE90]' : 'hover:bg-gray-100'}`}
                                                        >
                                                            <div className="font-bold text-green-700">+ New Customer: {customerSearchTerm}</div>
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                            <tr className="bg-blue-50">
                                <td colSpan="5" className="px-3 py-2 text-right font-bold border-r border-gray-300">Customer Name:</td>
                                <td className="px-3 py-1 border-r border-gray-300" colSpan="2">
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Customer Name *"
                                        className="w-full px-2 py-1 border border-gray-400 rounded text-sm outline-none focus:border-blue-600"
                                        disabled={!isNewCustomer && !!customerPhone}
                                    />
                                    {isNewCustomer && <span className="text-[10px] text-green-600 font-medium">New customer</span>}
                                    {!isNewCustomer && customerPhone && (
                                        <span className="text-[10px] text-blue-600 font-medium cursor-pointer" onClick={() => {
                                            setCustomerId(''); setCustomerName(''); setCustomerPhone(''); setCustomerSearchTerm(''); setIsNewCustomer(false);
                                        }}>Existing customer (clear)</span>
                                    )}
                                </td>
                            </tr>
                            <tr className="bg-blue-100/40">
                                <td colSpan="5" className="px-3 py-2 text-right font-bold border-r border-gray-300">Customer ID:</td>
                                <td className="px-3 py-1 border-r border-gray-300" colSpan="2">
                                    <input
                                        type="text"
                                        value={customerId}
                                        onChange={(e) => {
                                            setCustomerId(e.target.value);
                                            const val = e.target.value;
                                            if (val && !/^\d{12}$/.test(val) && !/^\d{9}[vVxX]$/.test(val) && !/^[A-Za-z0-9]{6,20}$/.test(val)) {
                                                setIdError('Invalid NIC/Passport');
                                            } else {
                                                setIdError('');
                                            }
                                        }}
                                        placeholder="NIC / Passport (optional)"
                                        className={`w-full px-2 py-1 border rounded text-sm outline-none ${idError ? 'border-red-500' : 'border-gray-400 focus:border-blue-600'}`}
                                    />
                                    {idError && <p className="text-red-500 text-[10px] mt-0.5">{idError}</p>}
                                </td>
                            </tr>
                            <tr className="bg-blue-50">
                                <td colSpan="5" className="px-3 py-2 text-right font-bold border-r border-gray-300">Date:</td>
                                <td className="px-3 py-1 border-r border-gray-300" colSpan="2">
                                    <input
                                        type="date"
                                        value={saleDate}
                                        onChange={(e) => setSaleDate(e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-400 rounded text-sm outline-none focus:border-blue-600"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* CHECKOUT BUTTON */}
                    <div className="flex justify-end gap-3 py-3 px-3 bg-white border-t border-gray-200">
                        {cart.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="px-5 py-2 border-2 border-gray-400 bg-gray-100 hover:bg-gray-200 rounded font-bold text-sm transition-colors"
                            >
                                Clear Cart
                            </button>
                        )}
                        <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || !customerName || !customerPhone || isProcessingSale}
                            className="px-6 py-2 bg-[#2563eb] text-white hover:bg-[#1d4ed8] rounded font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            {isProcessingSale ? 'Processing...' : 'Close Sale & Print'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Dialog Component */}
            <Dialog
                isOpen={dialog.isOpen}
                onClose={() => {
                    setDialog({ ...dialog, isOpen: false });
                    setTimeout(() => {
                        if (searchInputRef.current) searchInputRef.current.focus();
                    }, 50);
                }}
                title={dialog.title}
                message={dialog.message}
                type={dialog.type}
                onConfirm={dialog.onConfirm}
            />

            {/* Print Bill Component */}
            {showPrintBill && completedSale && (
                <PrintableBill
                    saleData={completedSale}
                    showPreview={true}
                    onClose={() => {
                        setShowPrintBill(false);
                        setCompletedSale(null);
                    }}
                />
            )}
        </div>
    );
};

export default POS;
