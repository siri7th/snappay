// pages/shared/QRScanner.tsx (optimized version)
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCodeIcon,
  CameraIcon,
  SunIcon,
  XMarkIcon,
  PhotoIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import toast from 'react-hot-toast';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose?: () => void;
  title?: string;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, title = 'Scan QR Code' }) => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout>();

  // Detect browser and platform
  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);
    
    // Check if Android
    const android = /Android/.test(navigator.userAgent);
    setIsAndroid(android);
    
    // Camera requires a secure context on most mobile browsers (HTTPS or localhost).
    const isProbablyInsecure =
      !window.isSecureContext &&
      !['localhost', '127.0.0.1'].includes(window.location.hostname) &&
      !window.location.hostname.endsWith('.localhost');

    // Check camera support
    const hasMediaSupport = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && !isProbablyInsecure;
    setHasCamera(hasMediaSupport);
    
    if (!hasMediaSupport) {
      setPermissionState('unsupported');
      setCameraError(
        isProbablyInsecure
          ? 'Camera needs HTTPS (or open on localhost) on mobile browsers'
          : 'Camera API not supported in this browser'
      );
    }
    
    return () => {
      stopScanning();
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // If we get here, permission was granted
      stream.getTracks().forEach(track => track.stop()); // Stop immediately
      setPermissionState('granted');
      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setCameraError('Camera permission denied');
      } else if (err.name === 'NotFoundError') {
        setPermissionState('unsupported');
        setCameraError('No camera found');
      }
      return false;
    }
  };

  const startScanning = async () => {
    setScanning(true);
    setManualMode(false);
    setCameraError(null);
    setIsProcessing(false);
    
    try {
      // Check permission first if not granted
      if (permissionState !== 'granted') {
        const granted = await requestCameraPermission();
        if (!granted) {
          setScanning(false);
          setManualMode(true);
          return;
        }
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');
        
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.error('Play error:', playError);
          toast.error('Tap anywhere to start camera');
          
          const handleClick = () => {
            if (videoRef.current) {
              videoRef.current.play();
            }
            document.removeEventListener('click', handleClick);
          };
          document.addEventListener('click', handleClick);
        }
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setScanning(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setCameraError('Camera permission denied');
        
        if (isIOS) {
          toast.error('Please enable camera: Settings → Safari → Camera → Allow');
        } else if (isAndroid) {
          toast.error('Tap the camera icon in address bar to allow permission');
        } else {
          toast.error('Please allow camera access');
        }
      } else if (err.name === 'NotFoundError') {
        setPermissionState('unsupported');
        setCameraError('No camera found');
        toast.error('No camera detected on this device');
      } else {
        setPermissionState('unsupported');
        setCameraError('Camera unavailable');
        toast.error('Camera not available. Use manual entry instead.');
      }
      
      setManualMode(true);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    setScanning(false);
    setTorchOn(false);
    setIsProcessing(false);
  };

  const toggleTorch = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      
      try {
        // @ts-ignore - torch capability
        if (track.getCapabilities && track.getCapabilities().torch) {
          // @ts-ignore
          await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
          setTorchOn(!torchOn);
        } else {
          toast.error('Torch not available on this device');
        }
      } catch (err) {
        toast.error('Failed to toggle torch');
      }
    }
  };

  const captureQR = () => {
    // Prevent double scans
    if (isProcessing || !videoRef.current || !canvasRef.current) return;
    setIsProcessing(true);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      toast.success('QR Code detected!');
      
      // Mock QR data for demo - in production, use actual QR scanner library
      const mockQR = JSON.stringify({
        type: 'payment',
        upiId: 'merchant@bank',
        amount: 500,
        merchant: 'Demo Store'
      });
      
      // Stop scanning first
      stopScanning();
      
      // Then call onScan with delay
      scanTimeoutRef.current = setTimeout(() => {
        onScan(mockQR);
        setIsProcessing(false);
      }, 500);
    } else {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualInput) {
      toast.error('Please enter QR data');
      return;
    }
    onScan(manualInput);
    toast.success('Submitted successfully!');
    if (onClose) onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    toast.success(`Uploading: ${file.name}`);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      toast.success('Image uploaded! Processing QR code...');
      
      // Simulate QR processing
      scanTimeoutRef.current = setTimeout(() => {
        const mockQR = JSON.stringify({
          type: 'payment',
          upiId: 'merchant@bank',
          amount: 500,
          merchant: 'Demo Store'
        });
        onScan(mockQR);
        toast.success('QR code processed!');
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 1500);
    };
    
    reader.onerror = () => {
      toast.error('Failed to read image file');
    };
    
    reader.readAsDataURL(file);
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const retryPermission = async () => {
    setPermissionState('prompt');
    setCameraError(null);
    await startScanning();
  };

  // Manual Entry Mode
  if (manualMode) {
    return (
      <div className="relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Enter Details Manually</h2>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <Card>
          <div className="space-y-4">
            <Input
              label="Enter Invite Code or UPI ID"
              placeholder="e.g., FAMILY123 or merchant@bank"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              autoFocus
            />

            <div className="flex flex-col gap-3">
              <Button onClick={handleManualSubmit} fullWidth>
                Submit
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <Button 
                variant="outline" 
                fullWidth 
                onClick={triggerFileUpload}
              >
                <PhotoIcon className="h-5 w-5 mr-2" />
                Upload QR Code Image
              </Button>
            </div>

            <button
              onClick={() => {
                setManualMode(false);
                setCameraError(null);
                startScanning();
              }}
              className="text-primary hover:underline text-sm block mx-auto mt-4"
            >
              ← Try camera instead
            </button>

            {isIOS && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium mb-2">📱 iOS Camera Tips:</p>
                <ul className="text-xs text-yellow-700 list-disc pl-4 space-y-1">
                  <li>Go to Settings → Safari → Camera → Allow</li>
                  <li>Don't use Private Browsing mode</li>
                  <li>Try Chrome browser instead</li>
                </ul>
              </div>
            )}

            {isAndroid && !isIOS && (
              <div className="mt-4 p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  ℹ️ Tap the lock/info icon in address bar and allow camera permission
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Permission denied state
  if (permissionState === 'denied') {
    return (
      <div className="relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        <Card className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CameraIcon className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Camera Access Denied</h3>
          <p className="text-sm text-gray-600 mb-6">
            Please enable camera access to scan QR codes.
          </p>
          <div className="space-y-3">
            <Button onClick={retryPermission} fullWidth>
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setManualMode(true)} 
              fullWidth
            >
              Use Manual Entry
            </Button>
          </div>
          {isIOS && (
            <p className="text-xs text-gray-500 mt-4">
              Settings → Safari → Camera → Allow
            </p>
          )}
        </Card>
      </div>
    );
  }

  // Main View
  return (
    <div className="relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Scanner View */}
      {scanning ? (
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-64 object-cover rounded-lg"
            playsInline
            autoPlay
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          <div className="absolute inset-0 border-4 border-primary opacity-50 rounded-lg"></div>
          <div className="absolute left-0 right-0 h-1 bg-primary animate-scan"></div>

          {cameraError && (
            <div className="absolute top-2 left-2 right-2 bg-error text-white p-2 rounded-lg text-sm">
              ⚠️ {cameraError}
            </div>
          )}

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            <button
              onClick={captureQR}
              disabled={isProcessing}
              className={`bg-primary text-white px-6 py-2 rounded-full flex items-center gap-2 shadow-lg ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-dark'
              }`}
            >
              <CameraIcon className="h-5 w-5" />
              {isProcessing ? 'Processing...' : 'Capture'}
            </button>
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-full shadow-lg transition-colors ${
                torchOn ? 'bg-primary text-white' : 'bg-white text-gray-700'
              }`}
              title={torchOn ? 'Turn off torch' : 'Turn on torch'}
            >
              <SunIcon className="h-5 w-5" />
            </button>
          </div>

          <button
            onClick={stopScanning}
            className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="text-center py-8">
            <QrCodeIcon className="h-16 w-16 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
            
            {cameraError && (
              <p className="text-sm text-error mb-4">
                ⚠️ {cameraError}
              </p>
            )}

            <div className="space-y-3 mt-4">
              <Button onClick={startScanning} fullWidth size="lg">
                <CameraIcon className="h-5 w-5 mr-2" />
                Scan with Camera
              </Button>

              <Button onClick={() => setManualMode(true)} variant="outline" fullWidth size="lg">
                <PhotoIcon className="h-5 w-5 mr-2" />
                Enter Manually / Upload QR
              </Button>
            </div>

            {isIOS && (
              <div className="mt-6 p-3 bg-yellow-50 rounded-lg text-left">
                <p className="text-sm text-yellow-800 font-medium mb-2">📱 iOS Camera Tips:</p>
                <ul className="text-xs text-yellow-700 list-disc pl-4 space-y-1">
                  <li>Settings → Safari → Camera → Allow</li>
                  <li>Don't use Private Browsing mode</li>
                  <li>Try Chrome browser instead</li>
                </ul>
              </div>
            )}

            {isAndroid && !isIOS && (
              <div className="mt-4 p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  ℹ️ Tap the lock/info icon in address bar and allow camera permission
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default QRScanner;