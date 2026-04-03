// pages/shared/ReceiveMoney.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  DocumentDuplicateIcon, 
  ArrowDownTrayIcon,
  QrCodeIcon,
  UserIcon,
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';
import { useWallet } from '../../hooks/useWallet';
import { useFamily } from '../../hooks/useFamily';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {  copyToClipboard } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface PaymentRequest {
  id: string;
  from: string;
  fromPhone: string;
  amount: number;
  note?: string;
  time: string;
  status: 'pending' | 'paid' | 'cancelled';
}

const ReceiveMoney: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance } = useWallet();
  const { limits } = useFamily();
  const [amount, setAmount] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestPhone, setRequestPhone] = useState('');
  const [requestNote, setRequestNote] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);

  const upiId = `${user?.phone}@snappay`;
  const qrData = JSON.stringify({
    pa: upiId,
    pn: user?.name || 'User',
    am: amount || undefined,
    cu: 'INR',
    tn: 'SnapPay Payment'
  });

  useEffect(() => {
    loadPaymentRequests();
  }, []);

  const loadPaymentRequests = async () => {
    setLoading(true);
    try {
      // In production, fetch from API
      // For now, use mock data
      setPaymentRequests([
        {
          id: '1',
          from: 'Riya Sharma',
          fromPhone: '9876543211',
          amount: 500,
          note: 'For groceries',
          time: new Date(Date.now() - 5 * 60000).toISOString(),
          status: 'pending'
        },
        {
          id: '2',
          from: 'Friend',
          fromPhone: '9988776655',
          amount: 200,
          note: 'Lunch money',
          time: new Date(Date.now() - 60 * 60000).toISOString(),
          status: 'pending'
        }
      ]);
    } catch (error) {
      console.error('Failed to load payment requests:', error);
      toast.error('Failed to load payment requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById('receive-qr-code') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `snappay-qr-${user?.phone}.png`;
      link.href = url;
      link.click();
      toast.success('QR code downloaded');
    }
  };

  const handleSendRequest = () => {
    if (!requestPhone) {
      toast.error('Please enter a phone number');
      return;
    }
    if (!requestAmount || parseFloat(requestAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // In production, send to API
    toast.success('Payment request sent!');
    setShowRequestModal(false);
    setRequestPhone('');
    setRequestAmount('');
    setRequestNote('');
  };

  const handlePayRequest = (request: PaymentRequest) => {
    navigate('/linked/send', { 
      state: { 
        to: request.fromPhone,
        amount: request.amount,
        note: request.note 
      } 
    });
  };

  const handleDeclineRequest = (requestId: string) => {
    if (window.confirm('Decline this payment request?')) {
      setPaymentRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success('Request declined');
    }
  };

  const todayReceived = 700; // This would come from API
  const dailyLimit = 50000;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Receive Money</h1>
      </div>

      {/* Limit Info for Linked Users */}
      {user?.role === 'LINKED' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm text-yellow-700">
                Today's Received: {formatCurrency(todayReceived)} / {formatCurrency(dailyLimit)}
              </p>
              <div className="w-full bg-yellow-200 h-1.5 rounded-full mt-2">
                <div 
                  className="bg-yellow-600 h-1.5 rounded-full"
                  style={{ width: `${Math.min((todayReceived / dailyLimit) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                Daily receiving limit: {formatCurrency(dailyLimit)}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column - UPI ID & QR */}
        <div className="space-y-6">
          {/* UPI ID Card */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Your Payment Details</h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-1">Share this UPI ID</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-white border rounded font-mono text-sm">{upiId}</code>
                <button
                  onClick={() => handleCopy(upiId, 'UPI ID')}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Copy UPI ID"
                >
                  <DocumentDuplicateIcon className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Request Specific Amount (Optional)"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
              />
              
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowQR(true)}
              >
                Generate QR with Amount
              </Button>
            </div>
          </Card>

          {/* QR Code Card */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Scan QR Code</h2>
            <div className="bg-white p-6 rounded-lg border-2 border-dashed flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <QRCodeSVG 
                  id="receive-qr-code"
                  value={qrData} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              <p className="text-sm text-gray-600 text-center mb-4">
                Ask sender to scan this QR code
                {amount && ` for ${formatCurrency(parseFloat(amount))}`}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(qrData, 'QR data')}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Copy QR data"
                >
                  <DocumentDuplicateIcon className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={handleDownloadQR}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Download QR code"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Payment Requests & History */}
        <div className="space-y-6">
          {/* Request Money Card */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Request Money</h2>
            <div className="space-y-4">
              <button
                onClick={() => setShowRequestModal(true)}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary-50 transition-colors text-center"
              >
                <QrCodeIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Create a new payment request</p>
              </button>
            </div>
          </Card>

          {/* Pending Payment Requests */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Payment Requests</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadPaymentRequests}
                disabled={loading}
              >
                <ArrowPathIcon className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading...</p>
              </div>
            ) : paymentRequests.length === 0 ? (
              <div className="text-center py-8">
                <QrCodeIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentRequests.map(req => (
                  <Card key={req.id} className="p-4 border hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{req.from}</p>
                        <p className="text-sm text-gray-500">{req.fromPhone}</p>
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(req.time)}</span>
                    </div>
                    {req.note && (
                      <p className="text-sm text-gray-600 mb-2">{req.note}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(req.amount)}
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="primary"
                          onClick={() => handlePayRequest(req)}
                        >
                          Pay
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeclineRequest(req.id)}
                          className="border-error text-error hover:bg-error-soft"
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Receives */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Recent Receives</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                  <span className="text-success font-bold">↓</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">From: Rajesh</p>
                  <p className="text-xs text-gray-500">Today, 10:30 AM</p>
                </div>
                <span className="font-bold text-success">+{formatCurrency(500)}</span>
              </div>
              <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                  <span className="text-success font-bold">↓</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">From: Priya</p>
                  <p className="text-xs text-gray-500">Yesterday, 3:45 PM</p>
                </div>
                <span className="font-bold text-success">+{formatCurrency(200)}</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              fullWidth 
              className="mt-4"
              onClick={() => navigate('/transactions')}
            >
              View All Transactions
            </Button>
          </Card>
        </div>
      </div>

      {/* Request Money Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Request Money</h2>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="From (Phone Number)"
                placeholder="Enter phone number"
                value={requestPhone}
                onChange={(e) => setRequestPhone(e.target.value)}
                autoFocus
              />
              
              <Input
                label="Amount (₹)"
                type="number"
                placeholder="Enter amount"
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                min="1"
              />
              
              <Input
                label="Note (Optional)"
                placeholder="What's it for?"
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
              />

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSendRequest} className="flex-1">
                  Send Request
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowRequestModal(false)} 
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReceiveMoney;