import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Error caught by boundary:', error, errorInfo);
        }
        
        // Here you could send error to a logging service
        // logErrorToService(error, errorInfo);
    }

    handleRefresh = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
                            <p className="text-red-100 mt-2">An unexpected error occurred</p>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <p className="text-gray-600 text-center">
                                We're sorry, but something went wrong. Please try refreshing the page or go back to the home page.
                            </p>
                            
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="bg-gray-100 rounded-lg p-4 overflow-auto max-h-48">
                                    <p className="text-xs font-mono text-red-600 whitespace-pre-wrap">
                                        {this.state.error.toString()}
                                    </p>
                                    {this.state.errorInfo && (
                                        <p className="text-xs font-mono text-gray-500 mt-2 whitespace-pre-wrap">
                                            {this.state.errorInfo.componentStack}
                                        </p>
                                    )}
                                </div>
                            )}
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={this.handleRefresh}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                                >
                                    <RefreshCw size={18} />
                                    Refresh Page
                                </button>
                                <button
                                    onClick={this.handleGoHome}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors"
                                >
                                    <Home size={18} />
                                    Go Home
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;


