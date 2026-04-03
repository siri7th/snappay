// src/pages/auth/Landing.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheckIcon,
  UserGroupIcon,
  BanknotesIcon,
  LockClosedIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon,
  RocketLaunchIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoginModal from '../../components/auth/LoginModal';
import { useSocket } from '../../hooks/useSocket';
import { APP_CONFIG, ROUTES } from '../../utils/constants';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected } = useSocket();
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupOptions, setShowSignupOptions] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollIndicator(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stats = [
    { value: '50K+', label: 'Active Users' },
    { value: '₹100Cr+', label: 'Transactions' },
    { value: '99.9%', label: 'Uptime' },
  ];

  const features = [
    {
      icon: UserGroupIcon,
      title: 'Family Sharing',
      description: 'Link family members with custom spending limits',
    },
    {
      icon: BanknotesIcon,
      title: 'Smart Limits',
      description: 'Set daily, monthly, and per-transaction limits',
    },
    {
      icon: LockClosedIcon,
      title: 'Bank Level Security',
      description: 'Bank-grade encryption for your money',
    },
  ];

  const howItWorks = [
    { step: 1, title: 'Create Account', description: 'Sign up as primary or linked user' },
    { step: 2, title: 'Connect Family', description: 'Link members with invite codes or QR' },
    { step: 3, title: 'Start Transacting', description: 'Send money and manage expenses' },
  ];

  const handleSignupClick = (type: 'primary' | 'linked') => {
    setShowSignupOptions(false);
    navigate(`${ROUTES.AUTH}?type=${type}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">

      {/* 🔥 NAVBAR (Custom Text Logo Only) */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">

            {/* 🔴 Custom SnapPay Logo */}
            <h1
              onClick={() => navigate(ROUTES.HOME)}
              className="text-3xl font-extrabold cursor-pointer select-none"
            >
              <span className="text-white stroke-text">Snap</span>
              <span className="text-red-600 ml-1">Pay</span>
            </h1>

          </div>
        </div>
      </nav>

      {/* HERO */}
      <div className="container mx-auto px-4 py-16 lg:py-24 text-center">
        
        <div className="inline-flex items-center gap-2 bg-primary-soft px-4 py-2 rounded-full mb-8">
          <ShieldCheckIcon className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-primary">Secure • Fast • Simple</span>
        </div>

        <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
          Simple Payments for{' '}
          <span className="text-primary relative">
            Families
            <SparklesIcon className="absolute -top-6 -right-8 h-8 w-8 text-yellow-400 animate-pulse" />
          </span>
        </h1>

        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Send money, manage family expenses, and set spending limits—all in one place.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            size="lg" 
            onClick={() => setShowSignupOptions(true)}
            className="min-w-[200px]"
          >
            Get Started
          </Button>
        </div>

        {/* TRUST */}
        <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            <span>100% Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            <span>PCI DSS</span>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4 mt-16 max-w-2xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index}>
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Families Choose SnapPay
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Card key={i} className="text-center p-8">
                  <Icon className="h-8 w-8 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-primary py-16 text-center text-white">
        <RocketLaunchIcon className="h-16 w-16 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>

        <Button 
          size="lg" 
          variant="secondary"
          onClick={() => setShowSignupOptions(true)}
        >
          Create Account
        </Button>
      </div>

      {/* LOGIN MODAL */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSignupClick={() => {
          setShowLoginModal(false);
          setShowSignupOptions(true);
        }}
      />

      {/* SIGNUP MODAL */}
      {showSignupOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6 relative">

            <button onClick={() => setShowSignupOptions(false)} className="absolute top-4 right-4">
              <XMarkIcon className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-center mb-6">Create Account</h2>

            <button
              onClick={() => handleSignupClick('primary')}
              className="w-full p-4 border rounded-lg mb-3 hover:border-primary"
            >
              Primary Account
            </button>

            <button
              onClick={() => handleSignupClick('linked')}
              className="w-full p-4 border rounded-lg hover:border-primary"
            >
              Linked Account
            </button>
          </Card>
        </div>
      )}

      {/* 🔥 MINIMAL FOOTER */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          
          <div className="grid md:grid-cols-4 gap-8">
            
            {/* Logo + About */}
            <div>
              <h3 className="text-xl font-bold mb-4">
                <span className="text-white stroke-text">Snap</span>
                <span className="text-red-500">Pay</span>
              </h3>
              <p className="text-gray-400 text-sm">
                Simple payments for families. Send money, manage expenses, and set spending limits all in one place.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href={ROUTES.FEATURES} className="hover:text-white">Features</a></li>
                <li><a href={ROUTES.HOW_IT_WORKS} className="hover:text-white">How it Works</a></li>
                <li><a href={ROUTES.PRICING} className="hover:text-white">Pricing</a></li>
                <li><a href={ROUTES.FAQ} className="hover:text-white">FAQ</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href={ROUTES.CONTACT} className="hover:text-white">Contact Us</a></li>
                <li><a href={ROUTES.HELP} className="hover:text-white">Help Center</a></li>
                <li><a href={ROUTES.PRIVACY} className="hover:text-white">Privacy Policy</a></li>
                <li><a href={ROUTES.TERMS} className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Email: mds66027@gmail.com</li>
                <li>Phone: 7322085743</li>
                <li>Address: 123 Payment St, Digital City, DC 12345</li>
              </ul>
            </div>

          </div>

        </div>
      </footer>

      {/* 🔥 LOGO STROKE STYLE */}
      <style>{`
        .stroke-text {
          -webkit-text-stroke: 1px red;
          color: white;
        }
      `}</style>

    </div>
  );
};

export default Landing;