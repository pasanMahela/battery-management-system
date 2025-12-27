import { useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const config = {
        success: {
            icon: CheckCircle,
            bgColor: 'bg-green-500',
            textColor: 'text-white'
        },
        error: {
            icon: AlertCircle,
            bgColor: 'bg-red-500',
            textColor: 'text-white'
        },
        info: {
            icon: Info,
            bgColor: 'bg-blue-500',
            textColor: 'text-white'
        }
    };

    const { icon: Icon, bgColor, textColor } = config[type] || config.success;

    return (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className={`${bgColor} ${textColor} px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md`}>
                <Icon size={24} className="flex-shrink-0" />
                <p className="flex-1 font-medium">{message}</p>
                <button
                    onClick={onClose}
                    className="hover:bg-white/20 rounded p-1 transition-colors flex-shrink-0"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default Toast;
