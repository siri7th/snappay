// pages/primary/ReceiveMoney.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ReceiveMoney: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the shared receive money page
    navigate('/receive', { replace: true });
  }, [navigate]);

  return null;
};

export default ReceiveMoney;