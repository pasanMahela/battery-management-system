import { createContext, useState, useRef, useCallback, useEffect } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { APP_CONFIG } from '../constants/constants';

const ScannerContext = createContext(null);

export const ScannerProvider = ({ children }) => {
    const [status, setStatus] = useState('idle'); // idle | connecting | waiting | connected | error
    const [sessionId, setSessionId] = useState(null);
    const [scannerUrl, setScannerUrl] = useState('');
    const [scannedCount, setScannedCount] = useState(0);
    const [lastBarcode, setLastBarcode] = useState('');
    const [showQR, setShowQR] = useState(false);

    const connectionRef = useRef(null);
    const closingRef = useRef(false);
    const onScanRef = useRef(null); // page-specific callback

    const hubUrl = `${APP_CONFIG.HUB_BASE_URL}/barcodehub`;

    const cleanup = useCallback(async () => {
        closingRef.current = true;
        if (connectionRef.current) {
            try {
                if (sessionId) {
                    await connectionRef.current.invoke('LeaveSession', sessionId);
                }
                await connectionRef.current.stop();
            } catch (e) {
                // Ignore cleanup errors
            }
            connectionRef.current = null;
        }
        setStatus('idle');
        setSessionId(null);
        setScannerUrl('');
        setScannedCount(0);
        setLastBarcode('');
        setShowQR(false);
        onScanRef.current = null;
    }, [sessionId]);

    // Start a new scanner session
    const startSession = useCallback((onScanCallback) => {
        // If already active, stop first
        if (connectionRef.current) {
            cleanup().then(() => _initSession(onScanCallback || null));
            return;
        }
        _initSession(onScanCallback || null);
    }, [cleanup]);

    const _initSession = async (onScanCallback) => {
        closingRef.current = false;
        const newSessionId = crypto.randomUUID();
        const url = `${window.location.origin}/scanner/${newSessionId}`;

        setSessionId(newSessionId);
        setScannerUrl(url);
        setScannedCount(0);
        setLastBarcode('');
        setShowQR(true);
        onScanRef.current = onScanCallback;

        try {
            setStatus('connecting');

            const connection = new HubConnectionBuilder()
                .withUrl(hubUrl)
                .withAutomaticReconnect([0, 2000, 5000, 10000])
                .configureLogging(LogLevel.Warning)
                .build();

            // Phone connected
            connection.on('DeviceConnected', () => {
                if (!closingRef.current) {
                    setStatus('connected');
                    setShowQR(false); // Auto-close QR modal
                }
            });

            // Phone disconnected
            connection.on('DeviceDisconnected', () => {
                if (!closingRef.current) {
                    // Phone left — stop the session
                    cleanup();
                }
            });

            // Barcode received
            connection.on('BarcodeReceived', (barcode) => {
                if (closingRef.current) return;
                setScannedCount(prev => prev + 1);
                setLastBarcode(barcode);
                // Call the page-specific callback
                if (onScanRef.current) {
                    onScanRef.current(barcode);
                }
            });

            connection.onreconnecting(() => {
                if (!closingRef.current) setStatus('connecting');
            });

            connection.onreconnected(async () => {
                if (!closingRef.current) {
                    await connection.invoke('CreateSession', newSessionId);
                    setStatus('waiting');
                }
            });

            connection.onclose(() => {
                if (!closingRef.current) {
                    setStatus('idle');
                    setSessionId(null);
                }
            });

            await connection.start();
            connectionRef.current = connection;

            await connection.invoke('CreateSession', newSessionId);
            if (!closingRef.current) setStatus('waiting');
        } catch (err) {
            console.error('SignalR connection error:', err);
            if (!closingRef.current) setStatus('error');
        }
    };

    // Stop the session (from header stop button or anywhere)
    const stopSession = useCallback(() => {
        cleanup();
    }, [cleanup]);

    // Update the onScan callback (when page changes or callback updates)
    const setScanCallback = useCallback((cb) => {
        onScanRef.current = cb;
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            closingRef.current = true;
            if (connectionRef.current) {
                connectionRef.current.stop().catch(() => {});
            }
        };
    }, []);

    return (
        <ScannerContext.Provider value={{
            status,
            sessionId,
            scannerUrl,
            scannedCount,
            lastBarcode,
            showQR,
            setShowQR,
            startSession,
            stopSession,
            setScanCallback,
            isActive: status === 'connected' || status === 'waiting' || status === 'connecting',
        }}>
            {children}
        </ScannerContext.Provider>
    );
};

export default ScannerContext;
