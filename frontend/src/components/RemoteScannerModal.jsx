import { useContext, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Smartphone, Wifi, WifiOff, Loader2, Check, Copy } from 'lucide-react';
import ScannerContext from '../context/ScannerContext';

const RemoteScannerModal = ({ title = 'Connect Phone Scanner' }) => {
    const { status, scannerUrl, showQR, setShowQR, stopSession } = useContext(ScannerContext);
    const [copied, setCopied] = useState(false);

    const copyUrl = () => {
        navigator.clipboard.writeText(scannerUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleClose = () => {
        // If not yet connected, cancel the session entirely
        if (status !== 'connected') {
            stopSession();
        } else {
            // Already connected — just close the QR overlay
            setShowQR(false);
        }
    };

    if (!showQR) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                        <Smartphone size={22} />
                        <h3 className="text-lg font-bold">{title}</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5">
                    {/* Connection Status */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-sm font-medium ${
                        status === 'connected' ? 'bg-green-50 text-green-700' :
                        status === 'waiting' ? 'bg-blue-50 text-blue-700' :
                        status === 'error' ? 'bg-red-50 text-red-700' :
                        'bg-yellow-50 text-yellow-700'
                    }`}>
                        {status === 'connecting' && <><Loader2 size={16} className="animate-spin" /> Connecting to server...</>}
                        {status === 'waiting' && <><Wifi size={16} /> Waiting for phone to scan...</>}
                        {status === 'connected' && <><Wifi size={16} /> Phone connected! Closing...</>}
                        {status === 'error' && <><WifiOff size={16} /> Connection failed</>}
                    </div>

                    {/* QR Code */}
                    {status !== 'error' && (
                        <div className="flex flex-col items-center">
                            <div className="bg-white p-4 rounded-xl border-2 border-gray-200 shadow-inner">
                                <QRCodeSVG
                                    value={scannerUrl}
                                    size={220}
                                    bgColor="#ffffff"
                                    fgColor="#1e293b"
                                    level="M"
                                    includeMargin={false}
                                />
                            </div>
                            <p className="text-gray-500 text-sm mt-3 text-center">
                                Scan this QR code with your phone camera
                            </p>
                            <p className="text-gray-400 text-xs mt-1 text-center">
                                Scanner will appear in the header once connected
                            </p>

                            {/* Manual URL copy */}
                            <button
                                onClick={copyUrl}
                                className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-500 transition-colors"
                            >
                                {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy link</>}
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center py-6">
                            <WifiOff size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-sm text-gray-500 mb-3">Could not connect to the server</p>
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                    <button
                        onClick={handleClose}
                        className="w-full py-2.5 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RemoteScannerModal;
