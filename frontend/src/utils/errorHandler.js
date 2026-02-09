/**
 * Centralized error handling utility
 * Only logs to console in development mode
 * In production, errors can be sent to a monitoring service
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Log an error with context
 * @param {string} context - Where the error occurred
 * @param {Error|any} error - The error object
 */
export const logError = (context, error) => {
    if (isDevelopment) {
        console.error(`[${context}]`, error);
    }
    
    // In production, you could send to a monitoring service:
    // sendToMonitoringService({ context, error, timestamp: new Date() });
};

/**
 * Log a warning
 * @param {string} context - Where the warning occurred  
 * @param {string} message - Warning message
 */
export const logWarning = (context, message) => {
    if (isDevelopment) {
        console.warn(`[${context}]`, message);
    }
};

/**
 * Extract user-friendly message from API error
 * @param {Error} error - Axios error or regular error
 * @param {string} fallbackMessage - Default message if none found
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error, fallbackMessage = 'An error occurred') => {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    if (error.response?.data) {
        return typeof error.response.data === 'string' 
            ? error.response.data 
            : fallbackMessage;
    }
    if (error.message) {
        return error.message;
    }
    return fallbackMessage;
};

export default { logError, logWarning, getErrorMessage };


