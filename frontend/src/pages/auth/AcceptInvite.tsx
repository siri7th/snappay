// src/pages/auth/AcceptInvite.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { familyAPI } from '../../services/api/family';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ROUTES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

interface InvitationDetails {
  id: string;
  inviteCode: string;
  primaryId: string;
  primaryName?: string;
  primaryPhone?: string;
  invitedPhone: string;
  relationship: string;
  dailyLimit: number;
  monthlyLimit: number;
  perTransactionLimit: number;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
}

const AcceptInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [inviteDetails, setInviteDetails] = useState<InvitationDetails | null>(null);

  const token = searchParams.get('token');
  const code = searchParams.get('code');
  const verificationDone = useRef(false);

  useEffect(() => {
    if (verificationDone.current) return;
    verificationDone.current = true;
    
    const verifyInvite = async () => {
      try {
        let response;
        
        if (token) {
          response = await familyAPI.getInvitationById(token);
        } else if (code) {
          response = await familyAPI.getInvitationByCode(code);
        } else {
          setError('Invalid invite link');
          setVerifying(false);
          return;
        }

        if (response.data?.success && response.data?.data) {
          setInviteDetails(response.data.data);
          setSuccess(true);
          toast.success('Invite verified successfully!');
        } else {
          setError('Invalid or expired invite');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to verify invite');
      } finally {
        setVerifying(false);
      }
    };

    verifyInvite();
  }, [token, code]);

  const handleCreateAccount = () => {
    const inviteParam = token ? `token=${token}` : `code=${code}`;
    navigate(`${ROUTES.AUTH}?type=linked&${inviteParam}`);
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Verifying Your Invite</h2>
          <p className="text-gray-600">Please wait while we verify your invite...</p>
        </Card>
      </div>
    );
  }

  if (success && inviteDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CheckCircleIcon className="h-16 w-16 text-success mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invite Verified!</h2>
          <p className="text-gray-600 mb-4">
            You've been invited to join {inviteDetails.primaryName || 'a family'} account.
          </p>
          
          <div className="bg-primary-soft p-4 rounded-lg mb-6 text-left">
            <h3 className="font-semibold mb-2">Invitation Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Primary Account:</span>
                <span className="font-medium">{inviteDetails.primaryName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Relationship:</span>
                <span className="font-medium capitalize">{inviteDetails.relationship || 'Family Member'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Daily Limit:</span>
                <span className="font-medium">{formatCurrency(inviteDetails.dailyLimit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Limit:</span>
                <span className="font-medium">{formatCurrency(inviteDetails.monthlyLimit)}</span>
              </div>
            </div>
          </div>
          
          <Button onClick={handleCreateAccount} fullWidth>
            Create Your Account
          </Button>
          
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="text-gray-500 hover:text-gray-700 text-sm mt-4"
          >
            Go Home
          </button>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <XCircleIcon className="h-16 w-16 text-error mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invite Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Button onClick={() => navigate(ROUTES.JOIN_FAMILY)} fullWidth>
              Try Another Method
            </Button>
            <Button variant="outline" onClick={() => navigate(ROUTES.HOME)} fullWidth>
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};

export default AcceptInvite;