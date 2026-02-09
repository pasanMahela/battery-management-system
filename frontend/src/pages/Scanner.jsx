import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { Html5Qrcode } from 'html5-qrcode';
import { APP_CONFIG } from '../constants/constants';

const ScannerPage = () => {
    const { sessionId } = useParams();
    const [status, setStatus] = useState('connecting'); // connecting | connected | disconnected | error
    const [scanMode, setScanMode] = useState('camera'); // camera | manual
    const [manualBarcode, setManualBarcode] = useState('');
    const [lastScanned, setLastScanned] = useState('');
    const [scanCount, setScanCount] = useState(0);
    const [isScanning, setIsScanning] = useState(false);
    const [cameraError,setCameraError] = useState('');
    const connectionRef = useRef(null);
    const scannerRef = useRef(null);
    const endedRef = useRef(false);
    const scannerDivId = 'phone-barcode-scanner';

    const hubUrl = `${APP_CONFIG.HUB_BASE_URL}/barcodehub`;

    // Connect to SignalR hub
    useEffect(() => {
        const connect = async () => {
            try {
                const connection = new HubConnectionBuilder()
                    .withUrl(hubUrl)
                    .withAutomaticReconnect([0, 2000, 5000, 10000])
                    .configureLogging(LogLevel.Warning)
                    .build();

                // Desktop ended the session
                connection.on('DeviceDisconnected', () => {
                    endedRef.current = true;
                    stopCamera();
                    if (connectionRef.current) {
                        connectionRef.current.stop().catch(() => {});
                        connectionRef.current = null;
                    }
                    setStatus('disconnected');
                });

                // Session no longer exists (desktop already left before we joined)
                connection.on('SessionEnded', () => {
                    endedRef.current = true;
                    stopCamera();
                    if (connectionRef.current) {
                        connectionRef.current.stop().catch(() => {});
                        connectionRef.current = null;
                    }
                    setStatus('disconnected');
                });

                // Ignore DeviceConnected on phone side (suppresses console warning)
                connection.on('DeviceConnected', () => {});

                connection.onreconnecting(() => {
                    if (!endedRef.current) setStatus('connecting');
                });
                connection.onreconnected(async () => {
                    if (endedRef.current) {
                        connection.stop().catch(() => {});
                        return;
                    }
                    await connection.invoke('JoinSession', sessionId);
                    setStatus('connected');
                });
                connection.onclose(() => {
                    if (!endedRef.current) setStatus('disconnected');
                });

                await connection.start();
                await connection.invoke('JoinSession', sessionId);
                connectionRef.current = connection;
                setStatus('connected');
            } catch (err) {
                console.error('Connection error:', err);
                setStatus('error');
            }
        };

        connect();

        return () => {
            stopCamera();
            if (connectionRef.current) {
                connectionRef.current.invoke('LeaveSession', sessionId).catch(() => {});
                connectionRef.current.stop().catch(() => {});
            }
        };
    }, [sessionId, hubUrl]);

    // Start camera when mode changes to camera and connected
    useEffect(() => {
        if (scanMode === 'camera' && status === 'connected') {
            startCamera();
        } else {
            stopCamera();
        }

        return () => stopCamera();
    }, [scanMode, status]);

    const startCamera = async () => {
        setCameraError('');
        try {
            const devices = await Html5Qrcode.getCameras();
            if (!devices || devices.length === 0) {
                setCameraError('No camera found.');
                return;
            }

            // Prefer back camera
            let cameraId = devices[0].id;
            const backCam = devices.find(d =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('rear') ||
                d.label.toLowerCase().includes('environment')
            );
            if (backCam) cameraId = backCam.id;

            const scanner = new Html5Qrcode(scannerDivId);
            scannerRef.current = scanner;

            await scanner.start(
                cameraId,
                { fps: 15, qrbox: { width: 280, height: 100 }, aspectRatio: 1.0 },
                (decodedText) => handleBarcodeScan(decodedText),
                () => {} // Ignore scan failures
            );
            setIsScanning(true);
        } catch (err) {
            console.error('Camera error:', err);
            setCameraError('Camera access denied. Please allow camera permission.');
        }
    };

    const stopCamera = async () => {
        if (scannerRef.current) {
            try {
                const state = scannerRef.current.getState();
                if (state === 2) await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (e) {}
            scannerRef.current = null;
        }
        setIsScanning(false);
    };

    const handleBarcodeScan = async (barcode) => {
        if (!connectionRef.current || !barcode) return;

        // Prevent duplicate rapid scans of the same barcode
        if (barcode === lastScanned) return;

        try {
            await connectionRef.current.invoke('SendBarcode', sessionId, barcode);
            setLastScanned(barcode);
            setScanCount(prev => prev + 1);

            // Vibrate for feedback if supported
            if (navigator.vibrate) navigator.vibrate(100);

            // Reset duplicate prevention after 2s
            setTimeout(() => setLastScanned(''), 2000);
        } catch (err) {
            console.error('Send error:', err);
        }
    };

    const handleManualSend = (e) => {
        e.preventDefault();
        if (manualBarcode.trim()) {
            handleBarcodeScan(manualBarcode.trim());
            setManualBarcode('');
        }
    };

    const handleDisconnect = async () => {
        endedRef.current = true;
        stopCamera();
        if (connectionRef.current) {
            try {
                await connectionRef.current.invoke('LeaveSession', sessionId);
                await connectionRef.current.stop();
            } catch (e) {}
            connectionRef.current = null;
        }
        setStatus('disconnected');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col" style={{ touchAction: 'manipulation' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 flex items-center justify-between shadow-lg">
                <div>
                    <h1 className="text-lg font-bold">Barcode Scanner</h1>
                    <p className="text-blue-200 text-xs">Ruhunu Tyre House</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                    status === 'connected' ? 'bg-green-500/20 text-green-300' :
                    status === 'connecting' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-red-500/20 text-red-300'
                }`}>
                    <span className={`w-2 h-2 rounded-full ${
                        status === 'connected' ? 'bg-green-400 animate-pulse' :
                        status === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                        'bg-red-400'
                    }`} />
                    {status === 'connected' ? 'Connected' :
                     status === 'connecting' ? 'Connecting...' :
                     status === 'disconnected' ? 'Disconnected' : 'Error'}
                </div>
            </div>

            {/* Session Ended - Full Screen Block */}
            {status === 'disconnected' && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-5">
                        <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Session Ended</h2>
                    <p className="text-gray-400 text-sm mb-6">The scanning session has been disconnected.<br/>You can safely close this tab.</p>
                    <button
                        onClick={() => window.close()}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
                    >
                        Close Tab
                    </button>
                </div>
            )}

            {status === 'error' && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-5">
                        <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Connection Failed</h2>
                    <p className="text-gray-400 text-sm mb-6">Could not connect to the desktop application.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Main Content */}
            {status === 'connected' && (
                <div className="flex-1 flex flex-col">
                    {/* Mode Tabs */}
                    <div className="flex bg-gray-800 border-b border-gray-700">
                        <button
                            onClick={() => setScanMode('camera')}
                            className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                                scanMode === 'camera'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            📷 Camera Scan
                        </button>
                        <button
                            onClick={() => setScanMode('manual')}
                            className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                                scanMode === 'manual'
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            ⌨️ Manual Entry
                        </button>
                    </div>

                    {/* Camera Scanner */}
                    {scanMode === 'camera' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-4">
                            {cameraError ? (
                                <div className="text-center">
                                    <p className="text-red-400 text-sm mb-3">{cameraError}</p>
                                    <button
                                        onClick={startCamera}
                                        className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="w-full max-w-sm rounded-xl overflow-hidden bg-black relative">
                                        <div id={scannerDivId} className="w-full" />
                                        {!isScanning && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                                                <div className="text-center">
                                                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
                                                    <p className="text-sm text-gray-300">Starting camera...</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-gray-400 text-sm mt-3 text-center">
                                        Point camera at a barcode
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Manual Entry */}
                    {scanMode === 'manual' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-6">
                            <form onSubmit={handleManualSend} className="w-full max-w-sm space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Enter Barcode
                                    </label>
                                    <input
                                        type="text"
                                        value={manualBarcode}
                                        onChange={(e) => setManualBarcode(e.target.value)}
                                        placeholder="Type or paste barcode..."
                                        className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-xl text-white text-lg font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        autoFocus
                                        autoComplete="off"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!manualBarcode.trim()}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-medium text-lg transition-colors"
                                >
                                    Send to Desktop
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Scan Counter */}
                    {scanCount > 0 && (
                        <div className="bg-green-500/10 border-t border-green-500/20 px-4 py-3 text-center">
                            <p className="text-green-400 text-sm">
                                ✓ Last: <span className="font-mono font-bold">{lastScanned || '—'}</span>
                                <span className="ml-3 text-green-500/60">Total: {scanCount}</span>
                            </p>
                        </div>
                    )}

                    {/* Disconnect Button */}
                    <div className="p-4 bg-gray-800 border-t border-gray-700">
                        <button
                            onClick={handleDisconnect}
                            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
                        >
                            End Connection
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScannerPage;
