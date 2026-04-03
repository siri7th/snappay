import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';

const isValidPin = (pin: string) => /^\d{4}$/.test(pin);

const SetPin: React.FC = () => {
  const navigate = useNavigate();
  const { user, setPin, loading } = useAuth();

  const [pin, setPinValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAlreadySet = Boolean(user?.hasPin);
  const canSubmit = useMemo(() => isValidPin(pin) && pin === confirm, [pin, confirm]);

  const continueNext = () => {
    const role = user?.role;
    if (role === 'PRIMARY') navigate(ROUTES.PRIMARY_DASHBOARD, { replace: true });
    else navigate(ROUTES.LINKED_DASHBOARD, { replace: true });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPin(pin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }
    if (pin !== confirm) {
      toast.error('PIN and Confirm PIN do not match');
      return;
    }

    setSubmitting(true);
    try {
      await setPin(pin);
      toast.success('PIN set successfully');
      sessionStorage.removeItem('onboarding');
      continueNext();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to set PIN');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Set your UPI PIN</h1>
        <p className="text-sm text-gray-600 mb-6">
          This PIN will be required every time you send money or do a payment.
        </p>

        {isAlreadySet ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">Your PIN is already set.</p>
            <Button onClick={continueNext}>Continue</Button>
            <Button variant="outline" onClick={() => navigate(ROUTES.PRIMARY_SETTINGS_SECURITY)}>
              Change PIN
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="New PIN"
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
              helpText="4-digit PIN"
              required
            />
            <Input
              label="Confirm PIN"
              type="password"
              maxLength={4}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))}
              required
            />

            <Button type="submit" disabled={!canSubmit || submitting || loading}>
              {submitting ? 'Setting PIN...' : 'Set PIN'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default SetPin;

