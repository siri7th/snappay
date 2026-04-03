// pages/linked/LinkedScanPay.tsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCodeIcon, CameraIcon, DocumentDuplicateIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { usePayment } from '../../hooks/usePayment';
import { useFamily } from '../../hooks/useFamily';
import { formatCurrency } from '../../utils/formatters';
import QRScanner from '../shared/QRScanner'; // Fixed import path
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';

const LinkedScanPay: React.FC = () => {
  const navigate = useNavigate();
  const { processQRPayment, isLoading } = usePayment();
  const { limits } = useFamily();
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [qrData, setQrData] = useState('');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const remaining = limits?.dailyLimit - limits?.dailySpent || 0;
  const perTransactionLimit = limits?.perTransactionLimit || 0;

  const handleScan = (data: string) => {
    console.log('QR Scanned:', data);
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(data);
      setQrData(data);
      
      if (parsed.pa || parsed.upiId) {
        // UPI QR code
        setMerchant(parsed.pn || parsed.merchant || 'Merchant');
        if (parsed.am) {
          setAmount(parsed.am.toString());
        }
      } else {
        setMerchant('QR Payment');
      }
      
      setScanning(false);
      setShowConfirm(true);
      toast.success('QR Code scanned successfully!');
    } catch (e) {
      // If not JSON, treat as plain UPI ID or string
      setQrData(data);
      setMerchant('QR Payment');
      setScanning(false);
      setShowConfirm(true);
    }
  };

  const startScanning = () => {
    setScanning(true);
    setManualMode(false);
    setError('');
  };

  const stopScanning = () => {
    setScanning(false);
  };

  const handleManualSubmit = () => {
    if (!qrData) {
      setError('Please enter QR data');
      return;
    }
    if (!amount) {
      setError('Please enter amount');
      return;
    }
    if (parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!user?.hasPin) {
      toast.error('Please set your PIN to activate payments');
      sessionStorage.setItem('onboarding', 'true');
      navigate(ROUTES.SET_PIN, { replace: true });
      return;
    }
    setPin('');
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    const amountNum = parseFloat(amount);
    
    // Validate limits
    if (amountNum > remaining) {
      toast.error(`Amount exceeds your daily remaining limit of ${formatCurrency(remaining)}`);
      return;
    }
    
    if (amountNum > perTransactionLimit) {
      toast.error(`Amount exceeds per transaction limit of ${formatCurrency(perTransactionLimit)}`);
      return;
    }

    try {
      if (pin.length !== 4) {
        toast.error('Please enter 4-digit PIN');
        return;
      }
      await processQRPayment({ qrData, amount: amountNum, pin });
      toast.success('Payment successful!');
      navigate('/linked/transactions');
    } catch (error: any) {
      toast.error(error.message || 'Payment failed');
    } finally {
      setShowConfirm(false);
    }
  };

  const isValidAmount = parseFloat(amount) > 0 && 
                       parseFloat(amount) <= remaining && 
                       parseFloat(amount) <= perTransactionLimit;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/linked/dashboard')}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Scan & Pay</h1>
      </div>

      {/* Limit Info */}
      <Card className="mb-6 bg-yellow-50 border-yellow-200">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Today's Remaining</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(remaining)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Per Transaction</p>
            <p className="font-semibold">Max {formatCurrency(perTransactionLimit)}</p>
          </div>
        </div>
      </Card>

      {/* Scanner or Manual Input */}
      {scanning ? (
        <div className="relative">
          <QRScanner 
            onScan={handleScan} 
            onClose={stopScanning}
            title="Scan QR Code to Pay"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Scan Button */}
          <Card 
            className="text-center py-8 cursor-pointer hover:shadow-lg transition-all hover:scale-105" 
            onClick={startScanning}
          >
            <div className="w-20 h-20 bg-primary-soft rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCodeIcon className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-1">Scan QR Code</h2>
            <p className="text-sm text-gray-500">Tap to open camera and scan</p>
          </Card>

          {/* Manual Entry Toggle */}
          <button
            onClick={() => setManualMode(!manualMode)}
            className="text-primary hover:underline text-sm block mx-auto"
          >
            {manualMode ? 'Hide manual entry' : 'Enter UPI ID manually'}
          </button>

          {/* Manual Entry Form */}
          {manualMode && (
            <Card>
              <h3 className="font-semibold mb-4">Enter UPI Details</h3>
              <div className="space-y-4">
                <Input
                  label="UPI ID / QR Data"
                  placeholder="merchant@bank"
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                  error={error}
                />
                <Input
                  label="Amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                />
                
                {/* Amount validation feedback */}
                {amount && parseFloat(amount) > 0 && (
                  <div className="space-y-2">
                    {parseFloat(amount) > remaining && (
                      <p className="text-sm text-error flex items-center gap-1">
                        ⚠️ Exceeds daily remaining limit of {formatCurrency(remaining)}
                      </p>
                    )}
                    {parseFloat(amount) > perTransactionLimit && (
                      <p className="text-sm text-error flex items-center gap-1">
                        ⚠️ Exceeds per transaction limit of {formatCurrency(perTransactionLimit)}
                      </p>
                    )}
                  </div>
                )}

                <Button 
                  onClick={handleManualSubmit} 
                  fullWidth 
                  disabled={!qrData || !amount || parseFloat(amount) <= 0}
                >
                  Proceed to Pay
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Confirm Payment</h2>
              <button 
                onClick={() => setShowConfirm(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Merchant</span>
                <span className="font-medium">{merchant || 'QR Payment'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Amount</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(parseFloat(amount))}</span>
              </div>
              <div className="flex justify-between text-sm py-2">
                <span className="text-gray-600">Remaining after</span>
                <span className="font-medium">{formatCurrency(remaining - parseFloat(amount))}</span>
              </div>
            </div>

            {!isValidAmount && (
              <div className="mb-4 p-3 bg-error-soft rounded-lg">
                <p className="text-sm text-error">
                  Amount exceeds your available limit. Please adjust the amount.
                </p>
              </div>
            )}

            <div className="mb-6">
              <Input
                label="Enter UPI PIN"
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\\D/g, '').slice(0, 4))}
                helpText="4-digit PIN required to pay"
                required
              />
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.FORGOT_PIN)}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot PIN?
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleConfirm}
                className="flex-1"
                disabled={!isValidAmount || isLoading || pin.length !== 4}
                loading={isLoading}
              >
                Pay {formatCurrency(parseFloat(amount))}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowConfirm(false)} 
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LinkedScanPay;