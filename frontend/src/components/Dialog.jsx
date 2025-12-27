import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

const Dialog = ({ isOpen = true, onClose, title, message, type = 'info', onConfirm, confirmText = 'OK', cancelText = 'Cancel', autoClose }) => {
    if (!isOpen) return null;

    // Auto-close for success messages
    useEffect(() => {
        if (autoClose && type === 'success') {
            const timer = setTimeout(() => {
                onClose();
            }, autoClose);
            return () => clearTimeout(timer);
        }
    }, [autoClose, type, onClose]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget && type !== 'confirm') {
            onClose();
        }
    };

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        onClose();
    };

    const iconConfig = {
        success: { Icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
        error: { Icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
        warning: { Icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50' },
        info: { Icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' },
        confirm: { Icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' }
    };

    const { Icon, color, bg } = iconConfig[type] || iconConfig.info;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className={`${bg} p-6 border-b border-gray-100 flex items-start justify-between`}>
                    <div className="flex items-center gap-3">
                        <div className={`${color} ${bg} p-2 rounded-full`}>
                            <Icon size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    </div>
                    {type !== 'confirm' && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    )}
                </div>

                <div className="p-6">
                    <p className="text-gray-700 text-base leading-relaxed">{message}</p>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
                    {type === 'confirm' ? (
                        <>
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                            >
                                {confirmText}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                        >
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dialog;
