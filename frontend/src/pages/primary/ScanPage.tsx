// src/pages/primary/ScanPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import QRScanner from '../shared/QRScanner';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ROUTES } from '../../utils/constants';
import toast from 'react-hot-toast';

const ScanPage: React.FC = () => {
  const navigate = useNavigate();
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState('');

  const handleScan = (data: string) => {
    try {
      const qrData = JSON.parse(data);
      
      if (qrData.type === 'payment' || qrData.pa || qrData.upiId) {
        navigate(ROUTES.PRIMARY_SEND, { 
          state: { 
            paymentDetails: qrData,
            fromScan: true 
          } 
        });
      } else if (qrData.type === 'family_link' || qrData.token || qrData.inviteCode) {
        const token = qrData.token || qrData.inviteCode || data;
        navigate(`${ROUTES.ACCEPT_INVITE}?token=${token}`);
      } else {
        toast.error('Unknown QR code format');
      }
    } catch (e) {
      if (data.includes('@') || data.match(/^\d{10}$/)) {
        navigate(ROUTES.PRIMARY_SEND, { 
          state: { 
            to: data,
            fromScan: true 
          } 
        });
      } else if (data.length === 8 || data.includes('FAMILY')) {
        navigate(`${ROUTES.ACCEPT_INVITE}?code=${data}`);
      } else {
        toast.error('Invalid QR code format');
      }
    }
  };

  const handleManualSubmit = () => {
    if (!manualInput) {
      toast.error('Please enter QR data');
      return;
    }
    handleScan(manualInput);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(ROUTES.PRIMARY_DASHBOARD)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scan QR Code</h1>
            <p className="text-gray-600 mt-1">
              Scan a QR code to pay or connect with family members
            </p>
          </div>
        </div>

        {/* Scanner */}
        <QRScanner 
          onScan={handleScan} 
          title="Scan QR Code"
        />

        {/* Manual Entry Toggle */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setManualMode(!manualMode)}
            className="text-primary hover:underline text-sm"
          >
            {manualMode ? 'Hide manual entry' : 'Enter code manually'}
          </button>
        </div>

        {/* Manual Entry Form */}
        {manualMode && (
          <Card className="mt-4">
            <h3 className="font-semibold mb-4">Enter Code Manually</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Invite Code or UPI ID
                </label>
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g., FAMILY123 or merchant@bank"
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleManualSubmit} className="flex-1">
                  Submit
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setManualMode(false)} 
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Tips */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <QrCodeIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">Scanning Tips</h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc pl-4">
                <li>Position the QR code within the frame</li>
                <li>Ensure good lighting for better scanning</li>
                <li>You can also enter codes manually</li>
                <li>Payment QR codes will take you to send money</li>
                <li>Family invite codes will take you to accept invite</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ScanPage;