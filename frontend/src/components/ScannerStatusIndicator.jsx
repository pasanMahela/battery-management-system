import { useContext } from 'react';
import ScannerContext from '../context/ScannerContext';
import { Smartphone, X, ScanBarcode, Loader2 } from 'lucide-react';

const ScannerStatusIndicator = () => {
    const { status, scannedCount, startSession, stopSession } = useContext(ScannerContext);

    // Idle — show connect button
    if (status === 'idle' || status === 'error') {
        return (
            <button
                onClick={() => startSession()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
                title="Connect phone as barcode scanner"
            >
                <Smartphone size={14} />
                <span className="hidden sm:inline">Phone Scanner</span>
            </button>
        );
    }

    // Connecting / waiting for phone
    if (status === 'connecting' || status === 'waiting') {
        return (
            <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-lg px-2.5 py-1.5">
                <Loader2 size={14} className="text-yellow-600 animate-spin" />
                <span className="text-xs font-semibold text-yellow-700 hidden sm:inline">
                    {status === 'connecting' ? 'Connecting...' : 'Scan QR...'}
                </span>
                <button
                    onClick={stopSession}
                    className="ml-0.5 p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Cancel"
                >
                    <X size={14} />
                </button>
            </div>
        );
    }

    // Connected
    return (
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5">
            {/* Pulsing dot */}
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>

            {/* Icon + text */}
            <Smartphone size={14} className="text-green-600" />
            <span className="text-xs font-semibold text-green-700 hidden sm:inline">
                Phone Scanner
            </span>

            {/* Scan count badge */}
            {scannedCount > 0 && (
                <span className="flex items-center gap-0.5 bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    <ScanBarcode size={10} />
                    {scannedCount}
                </span>
            )}

            {/* Stop button */}
            <button
                onClick={stopSession}
                className="ml-0.5 p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Stop phone scanner"
            >
                <X size={14} />
            </button>
        </div>
    );
};

export default ScannerStatusIndicator;
