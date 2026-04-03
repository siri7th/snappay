// pages/linked/LinkedReceive.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  DocumentDuplicateIcon, 
  ArrowDownIcon,
  QrCodeIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';
import { useFamily } from '../../hooks/useFamily';
import { useWallet } from '../../hooks/useWallet';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { copyToClipboard } from '../../utils/helpers'; 
import toast from 'react-hot-toast';

const LinkedReceive: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { limits } = useFamily();
  const { transactions, getTransactions } = useWallet();
  const [amount, setAmount] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [recentReceives, setRecentReceives] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const upiId = `${user?.phone}@snappay`;
  const qrData = JSON.stringify({
    pa: upiId,
    pn: user?.name || 'User',
    am: amount || undefined,
    cu: 'INR',
    tn: 'SnapPay Payment'
  });

  useEffect(() => {
    loadRecentReceives();
  }, []);

  const loadRecentReceives = async () => {
    setLoading(true);
    try {
      await getTransactions({ limit: 10 });
      
      // Filter receive transactions
      if (transactions) {
        const receives = transactions
          .filter(t => t.type === 'RECEIVE' || t.type === 'PAYMENT_RECEIVED')
          .slice(0, 5);
        setRecentReceives(receives);
      }
    } catch (error) {
      console.error('Failed to load recent receives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById('qr-code') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `snappay-qr-${user?.phone}.png`;
      link.href = url;
      link.click();
      toast.success('QR code downloaded');
    }
  };

  const todayReceived = transactions
    ?.filter(t => {
      const today = new Date().toDateString();
      const txnDate = new Date(t.createdAt).toDateString();
      return (t.type === 'RECEIVE' || t.type === 'PAYMENT_RECEIVED') && txnDate === today;
    })
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/linked/dashboard')}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1 transition-colors"
        >
          <ArrowDownIcon className="h-4 w-4 rotate-90" />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Receive Money</h1>
      </div>

      {/* Limit Info for Linked Users */}
      {limits && (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm text-yellow-700">
                Today's Received: {formatCurrency(todayReceived)} / {formatCurrency(50000)}
              </p>
              <div className="w-full bg-yellow-200 h-1.5 rounded-full mt-2">
                <div 
                  className="bg-yellow-600 h-1.5 rounded-full"
                  style={{ width: `${Math.min((todayReceived / 50000) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                Daily receiving limit: ₹50,000
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* UPI ID Card */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Your UPI ID</h2>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600 mb-1">Share this ID to receive money</p>
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
                id="qr-code"
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
                <QrCodeIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Receives */}
      <Card className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Receives</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadRecentReceives}
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
        ) : recentReceives.length > 0 ? (
          <div className="space-y-3">
            {recentReceives.map((txn) => (
              <div 
                key={txn.id} 
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                onClick={() => navigate(`/transactions/${txn.id}`)}
              >
                <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                  <ArrowDownIcon className="h-5 w-5 text-success" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">From: {txn.senderName || txn.senderPhone || 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{formatDate(txn.createdAt)}</p>
                </div>
                <span className="font-bold text-success">+{formatCurrency(txn.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ArrowDownIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No recent receives</p>
            <p className="text-sm text-gray-400 mt-1">
              When you receive money, it will appear here
            </p>
          </div>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          fullWidth 
          className="mt-4"
          onClick={() => navigate('/linked/transactions?type=received')}
        >
          View All Transactions
        </Button>
      </Card>

      {/* Quick Tips */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <QrCodeIcon className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 mb-1">Quick Tips</h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc pl-4">
              <li>Share your UPI ID or QR code to receive money</li>
              <li>You can set a specific amount in the QR code</li>
              <li>Received money is added directly to your wallet</li>
              <li>Daily receiving limit is ₹50,000</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LinkedReceive;