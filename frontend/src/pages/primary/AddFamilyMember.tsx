// pages/primary/AddFamilyMember.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCodeIcon,
  EnvelopeIcon,
  UserPlusIcon,
  DocumentDuplicateIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import LimitSetter from '../../components/family/LimitSetter';
import { useFamily } from '../../hooks/useFamily';
import { isValidPhone } from '../../utils/validators';
import { copyToClipboard } from '../../utils/helpers';

type AddMethod = 'qr' | 'sms' | 'manual';

const AddFamilyMember: React.FC = () => {
  const navigate = useNavigate();
  const { inviteMember, generateQR } = useFamily();
  const [method, setMethod] = useState<AddMethod>('qr');
  const [step, setStep] = useState(1);
  const [qrData, setQrData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    relationship: '',
  });
  const [errors, setErrors] = useState({
    phone: '',
    name: '',
  });

  const [limits, setLimits] = useState({
    dailyLimit: 500,
    monthlyLimit: 5000,
    perTransactionLimit: 200,
    sendMoney: true,
    scanPay: true,
    recharge: true,
    viewHistory: true,
  });

  const methods = [
    { 
      id: 'qr', 
      label: 'QR Code', 
      icon: QrCodeIcon, 
      desc: 'Member scans your QR code',
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    { 
      id: 'sms', 
      label: 'SMS Invite', 
      icon: EnvelopeIcon, 
      desc: 'Send invite via text',
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    { 
      id: 'manual', 
      label: 'Add Manually', 
      icon: UserPlusIcon, 
      desc: 'Enter details now',
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
  ];

  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      const data = await generateQR();
      setQrData(data);
      setStep(2);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = { phone: '', name: '' };
    let isValid = true;

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
      isValid = false;
    }

    if (method === 'manual' && !formData.name) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSendInvite = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await inviteMember({ ...formData, ...limits });
      toast.success('Invitation sent successfully!');
      navigate('/primary/family');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (qrData?.qrData) {
      copyToClipboard(qrData.qrData);
      toast.success('QR data copied to clipboard');
      return;
    }
    toast.error('Nothing to copy');
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setQrData(null);
    } else if (method !== 'qr') {
      setStep(1);
    } else {
      navigate('/primary/family');
    }
  };

  // QR Code Step
  if (step === 2 && method === 'qr') {
    return (
      <div className="max-w-md mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to options
        </button>

        <Card className="text-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">QR Code Generated</h2>
          <p className="text-gray-600 mb-6">Ask your family member to scan this code</p>

          <div className="bg-white p-6 rounded-lg border-2 border-dashed border-primary-200 mb-6">
            <QRCodeSVG 
              value={qrData?.qrData || ''} 
              size={200}
              level="H"
              includeMargin={true}
              className="mx-auto"
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-500">Code expires in 10 minutes</p>
            
            <Button
              variant="outline"
              fullWidth
              onClick={handleCopyLink}
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
              Copy QR Data
            </Button>

            <Button 
              fullWidth 
              onClick={() => navigate('/primary/family')}
            >
              Done
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {step === 1 ? 'Back to Family Management' : 'Back to options'}
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Add Family Member</h1>
        <p className="text-gray-600 mt-1">Invite a new member to your family account</p>
      </div>

      {step === 1 ? (
        <>
          {/* Method Selection */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {methods.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id as AddMethod)}
                  className={`p-6 rounded-xl border-2 transition-all text-center ${
                    method === m.id
                      ? 'border-primary bg-primary-soft'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-14 h-14 ${m.bg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <Icon className={`h-7 w-7 ${m.color}`} />
                  </div>
                  <h3 className={`font-semibold ${method === m.id ? 'text-primary' : 'text-gray-700'}`}>
                    {m.label}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{m.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Form */}
          {(method === 'sms' || method === 'manual') && (
            <Card>
              <h2 className="text-lg font-semibold mb-4">
                {method === 'sms' ? 'Send SMS Invite' : 'Enter Member Details'}
              </h2>

              <div className="space-y-4">
                <Input
                  label="Mobile Number"
                  placeholder="Enter 10-digit number"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') });
                    setErrors({ ...errors, phone: '' });
                  }}
                  error={errors.phone}
                  maxLength={10}
                />

                {method === 'manual' && (
                  <>
                    <Input
                      label="Full Name"
                      placeholder="Enter member's full name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        setErrors({ ...errors, name: '' });
                      }}
                      error={errors.name}
                    />
                    <Input
                      label="Relationship (Optional)"
                      placeholder="e.g., Daughter, Son, Mother"
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    />
                  </>
                )}

                <Button 
                  fullWidth 
                  onClick={() => setStep(2)} 
                  disabled={!formData.phone || formData.phone.length !== 10}
                >
                  Next: Set Limits
                </Button>
              </div>
            </Card>
          )}

          {method === 'qr' && (
            <Card>
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-primary-soft rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCodeIcon className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Generate QR Code</h3>
                <p className="text-gray-600 mb-6">
                  Create a QR code for your family member to scan. They can scan it with their phone to connect instantly.
                </p>
                <Button 
                  onClick={handleGenerateQR} 
                  loading={loading}
                  size="lg"
                >
                  Generate QR Code
                </Button>
              </div>
            </Card>
          )}
        </>
      ) : (
        <>
          <LimitSetter
            memberName={formData.name || 'New Member'}
            initialValues={limits}
            onSubmit={async (data) => {
              setLimits(data);
              if (method === 'qr') {
                // For QR method, we already generated QR in step 2
                navigate('/primary/family');
              } else {
                await handleSendInvite();
              }
            }}
            onCancel={() => setStep(1)}
          />
        </>
      )}
    </div>
  );
};

export default AddFamilyMember;