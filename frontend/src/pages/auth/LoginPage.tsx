// src/pages/auth/LoginPage.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the main login page
    navigate(ROUTES.AUTH + window.location.search, { replace: true });
  }, [navigate]);

  return null;
};

export default LoginPage;