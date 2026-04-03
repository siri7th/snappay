// pages/primary/Notifications.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Notifications: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the shared notifications page
    navigate('/notifications', { replace: true });
  }, [navigate]);

  return null;
};

export default Notifications;