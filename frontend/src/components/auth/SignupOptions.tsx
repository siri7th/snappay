// src/components/auth/SignupOptions.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheckIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Button from '../common/Button';

const SignupOptions: React.FC = () => {
  const navigate = useNavigate();

  const handlePrimarySignup = () => {
    navigate('/auth?type=primary');
  };

  const handleLinkedSignup = () => {
    navigate('/auth?type=linked');
  };

  const features = [
    {
      type: 'primary',
      items: [
        'Create a family account to manage members',
        'Set spending limits for family members',
        'Monitor all family transactions',
        'Add money to member wallets',
        'Invite family members via QR or invite code'
      ]
    },
    {
      type: 'linked',
      items: [
        'Connect to a primary account',
        'Get spending limits set by primary',
        'Request limit increases when needed',
        'Make payments using family wallet',
        'Join via invite code or QR scan'
      ]
    }
  ];

  const comparisonFeatures = [
    { name: 'Create family account', primary: true, linked: false },
    { name: 'Set spending limits', primary: true, linked: false },
    { name: 'Add money to member wallets', primary: true, linked: false },
    { name: 'Request limit increase', primary: false, linked: true },
    { name: 'Make payments from family wallet', primary: true, linked: true },
    { name: 'View transaction history', primary: true, linked: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-soft to-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
        >
          <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Join SnapPay
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the type of account that best fits your needs
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Primary Account Option */}
          <Card 
            className="p-8 hover:shadow-xl transition-all duration-300 group border-2 border-transparent hover:border-primary cursor-pointer"
            onClick={handlePrimarySignup}
          >
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary-soft rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheckIcon className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Primary Account</h2>
              <p className="text-gray-500">Create and manage a family account</p>
            </div>

            <div className="space-y-4 mb-8">
              {features[0].items.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">{item}</span>
                </div>
              ))}
            </div>

            <Button 
              fullWidth 
              size="lg"
              onClick={handlePrimarySignup}
              className="group"
            >
              Create Primary Account
              <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="mt-4 p-3 bg-primary-soft/50 rounded-lg">
              <p className="text-xs text-gray-600 flex items-start gap-2">
                <InformationCircleIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>Best for parents, guardians, or family heads who want to manage family finances</span>
              </p>
            </div>
          </Card>

          {/* Linked Account Option */}
          <Card 
            className="p-8 hover:shadow-xl transition-all duration-300 group border-2 border-transparent hover:border-primary cursor-pointer"
            onClick={handleLinkedSignup}
          >
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary-soft rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <UserGroupIcon className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Linked Account</h2>
              <p className="text-gray-500">Join an existing family</p>
            </div>

            <div className="space-y-4 mb-8">
              {features[1].items.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600">{item}</span>
                </div>
              ))}
            </div>

            <Button 
              fullWidth 
              size="lg"
              variant="outline"
              onClick={handleLinkedSignup}
              className="group"
            >
              Join as Family Member
              <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="mt-4 p-3 bg-primary-soft/50 rounded-lg">
              <p className="text-xs text-gray-600 flex items-start gap-2">
                <InformationCircleIcon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>Best for children, spouses, or family members joining an existing family account</span>
              </p>
            </div>
          </Card>
        </div>

        {/* Comparison Table */}
        <Card className="mt-8 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Account Comparison
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Feature</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-primary">Primary</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Linked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparisonFeatures.map((feature, index) => (
                  <tr key={index}>
                    <td className="py-3 px-4 text-sm text-gray-600">{feature.name}</td>
                    <td className="text-center py-3 px-4">
                      {feature.primary ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500 inline" />
                      ) : (
                        <XMarkIcon className="h-5 w-5 text-gray-300 inline" />
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {feature.linked ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500 inline" />
                      ) : (
                        <XMarkIcon className="h-5 w-5 text-gray-300 inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* FAQ Section */}
        <Card className="mt-6 p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Can I have both account types?</h4>
              <p className="text-sm text-gray-600">
                Yes! You can be a primary account holder for your family while also being a linked member of another family account.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">How do I join a family as a linked member?</h4>
              <p className="text-sm text-gray-600">
                You'll need an invite code or QR code from a primary account holder. You can enter this during signup or later from your dashboard.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Can I switch account types later?</h4>
              <p className="text-sm text-gray-600">
                Your account type is permanent, but you can create a new account with a different type using the same phone number.
              </p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/auth')}
              className="text-primary font-medium hover:underline"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupOptions;