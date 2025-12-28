// Application Constants
// Centralized configuration for application-wide values

export const APP_CONFIG = {
    // Application Identity
    APP_NAME: 'Ruhunu Tyre House',
    APP_SUBTITLE: 'Battery Management System',
    SHOP_NAME: 'Ruhunu Tyre House',

    // API Configuration - Uses environment variable in production
    API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5038/api',

    // Currency
    CURRENCY: 'LKR',
    CURRENCY_SYMBOL: 'LKR',

    // Business Rules
    LOW_STOCK_THRESHOLD: 5,
    EXPIRING_SOON_MONTHS: 1,

    // Default Values
    DEFAULT_WARRANTY_MONTHS: 12,
    DEFAULT_SHELF_LIFE_MONTHS: 12,

    // Pagination
    ITEMS_PER_PAGE: 50,

    // Date Formats
    DATE_FORMAT: 'YYYY-MM-DD',
    DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
};

// User Roles and Permissions
export const USER_ROLES = {
    ADMIN: 'Admin',
    CASHIER: 'Cashier',
};

// Session Management
export const SESSION_CONFIG = {
    TIMEOUT_MINUTES: 30,
    TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes in milliseconds
    WARNING_BEFORE_LOGOUT_MS: 2 * 60 * 1000, // Show warning 2 minutes before logout
};

// Page Titles and Labels
export const PAGE_TITLES = {
    DASHBOARD: 'Welcome Back!',
    DASHBOARD_SUBTITLE: "Here's what's happening with your battery shop today.",

    INVENTORY: 'Battery Inventory',
    INVENTORY_SUBTITLE: 'Manage your battery stock and products',

    ADD_BATTERY: 'Add New Battery',
    ADD_BATTERY_SUBTITLE: 'Add a new battery to your inventory',

    SALES_HISTORY: 'Sales History',
    SALES_HISTORY_SUBTITLE: 'Track and manage your transaction records',

    POS: 'Point of Sale',
    POS_SUBTITLE: 'Process customer transactions',

    USER_MANAGEMENT: 'User Management',
    USER_MANAGEMENT_SUBTITLE: 'Manage system users and access control',
};

// API Endpoints
export const API_ENDPOINTS = {
    BATTERY: `${APP_CONFIG.API_BASE_URL}/Battery`,
    SALE: `${APP_CONFIG.API_BASE_URL}/Sale`,
    AUTH: `${APP_CONFIG.API_BASE_URL}/Auth`,
    REGISTER: `${APP_CONFIG.API_BASE_URL}/Auth/register`,
    RETURN: `${APP_CONFIG.API_BASE_URL}/Returns`,
};

// UI Constants
export const UI_CONSTANTS = {
    // Toast/Notification Durations
    TOAST_DURATION: 3000,

    // Animation Durations
    ANIMATION_DURATION: 300,

    // Debounce Delays
    SEARCH_DEBOUNCE: 300,
};

// Status Labels
export const STATUS_LABELS = {
    STOCK: {
        LOW: 'Low Stock',
        GOOD: 'Good Stock',
        OUT: 'Out of Stock',
    },
    EXPIRY: {
        EXPIRED: 'Expired',
        EXPIRING_SOON: 'Expiring Soon',
        VALID: 'Valid',
    },
};

export default APP_CONFIG;
