import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, ScanBarcode, SwitchCamera, Loader2 } from 'lucide-react';

const BarcodeScannerModal = ({ isOpen, onClose, onScan, title = 'Scan Barcode' }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState('');
    const [cameras, setCameras] = useState([]);
    const [activeCameraIdx, setActiveCameraIdx] = useState(0);
    const scannerRef = useRef(null);
    const scannerDivId = 'barcode-scanner-view';

    useEffect(() => {
        if (isOpen) {
            startScanner();
        }
        return () => {
            stopScanner();
        };
    }, [isOpen]);

    const startScanner = async () => {
        setError('');
        try {
            const devices = await Html5Qrcode.getCameras();
            if (!devices || devices.length === 0) {
                setError('No camera found on this device.');
                return;
            }
            setCameras(devices);

            // Prefer back camera
            let cameraIdx = 0;
            const backCam = devices.findIndex(d =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('rear') ||
                d.label.toLowerCase().includes('environment')
            );
            if (backCam >= 0) cameraIdx = backCam;
            setActiveCameraIdx(cameraIdx);

            await launchScanner(devices[cameraIdx].id);
        } catch (err) {
            console.error('Camera error:', err);
            setError('Camera access denied. Please allow camera permission and try again.');
        }
    };

    const launchScanner = async (cameraId) => {
        // Stop existing scanner first
        await stopScanner();

        try {
            const scanner = new Html5Qrcode(scannerDivId);
            scannerRef.current = scanner;
            setIsScanning(true);

            await scanner.start(
                cameraId,
                {
                    fps: 15,
                    qrbox: { width: 280, height: 120 },
                    aspectRatio: 1.0,
                    disableFlip: false,
                },
                (decodedText) => {
                    // Barcode scanned successfully
                    onScan(decodedText);
                    stopScanner();
                    onClose();
                },
                () => {
                    // Scan failure — just keep scanning, don't show error
                }
            );
        } catch (err) {
            console.error('Scanner start error:', err);
            setError('Failed to start camera. Try refreshing the page.');
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                const state = scannerRef.current.getState();
                if (state === 2) { // SCANNING
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (e) {
                // Ignore cleanup errors
            }
            scannerRef.current = null;
        }
        setIsScanning(false);
    };

    const switchCamera = async () => {
        if (cameras.length <= 1) return;
        const nextIdx = (activeCameraIdx + 1) % cameras.length;
        setActiveCameraIdx(nextIdx);
        await launchScanner(cameras[nextIdx].id);
    };

    const handleClose = () => {
        stopScanner();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                        <ScanBarcode size={22} />
                        <h3 className="text-lg font-bold">{title}</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scanner View */}
                <div className="p-4">
                    {error ? (
                        <div className="text-center py-8">
                            <Camera size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-red-500 text-sm font-medium">{error}</p>
                            <button
                                onClick={startScanner}
                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="relative rounded-xl overflow-hidden bg-black">
                                <div id={scannerDivId} className="w-full" />
                                {!isScanning && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                                        <div className="text-center text-white">
                                            <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                                            <p className="text-sm">Starting camera...</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <p className="text-center text-gray-500 text-sm mt-3">
                                Point the camera at a barcode to scan
                            </p>

                            {/* Camera switch button */}
                            {cameras.length > 1 && (
                                <div className="flex justify-center mt-3">
                                    <button
                                        onClick={switchCamera}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                                    >
                                        <SwitchCamera size={16} />
                                        Switch Camera ({activeCameraIdx + 1}/{cameras.length})
                                    </button>
                                </div>
                            )}
                        </>
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

export default BarcodeScannerModal;
