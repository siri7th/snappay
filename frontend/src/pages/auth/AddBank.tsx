// src/pages/auth/AddBank.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BuildingLibraryIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import AddBankForm from '../../components/banking/AddBankForm';
import { useBank } from '../../hooks/useBank';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';

const AddBank: React.FC = () => {
  const navigate = useNavigate();
  const { addBank, loading } = useBank();
  const { user } = useAuth();

  const handleSubmit = async (data: any) => {
    try {
      const response = await addBank(data);
      
      if (response?.success) {
        toast.success('Bank account added successfully!');
        
        const fromOnboarding = sessionStorage.getItem('onboarding') === 'true';
        if (fromOnboarding) {
          navigate(ROUTES.SET_PIN, { replace: true });
        } else {
          navigate(ROUTES.PRIMARY_BANKS);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add bank account');
    }
  };

  const handleSkip = () => {
    const fromOnboarding = sessionStorage.getItem('onboarding') === 'true';
    
    if (fromOnboarding) {
      toast.success('You can add a bank account later from settings');
      
      if (user?.role === 'PRIMARY') {
        navigate(ROUTES.SET_PIN, { replace: true });
      } else {
        navigate(ROUTES.PROFILE_SETUP);
      }
    } else {
      navigate(ROUTES.PRIMARY_BANKS);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add Bank Account</h1>
          <p className="text-gray-600 mt-1">
            Link your bank account to start making payments and adding money to your wallet
          </p>
        </div>

        <AddBankForm onSubmit={handleSubmit} />

        <div className="text-center mt-4">
          <button 
            onClick={handleSkip} 
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
            disabled={loading}
          >
            Skip for now (you can add later)
          </button>
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center text-xs text-gray-400">
          <p className="flex items-center justify-center gap-1">
            <BuildingLibraryIcon className="h-3 w-3" />
            Your bank details are encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddBank;