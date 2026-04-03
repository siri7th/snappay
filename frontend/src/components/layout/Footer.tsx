// src/components/layout/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col items-center justify-center gap-2">

        {/* 🔥 Minimal Logo */}
        <Link to={ROUTES.HOME}>
          <h2 className="text-xl font-extrabold select-none">
            <span className="text-white stroke-text">Snap</span>
            <span className="text-red-600 ml-1">Pay</span>
          </h2>
        </Link>

        {/* Copyright */}
        <p className="text-sm text-gray-500 text-center">
          © {currentYear} SnapPay. All rights reserved.
        </p>

      </div>

      {/* 🔥 LOGO STYLE */}
      <style>{`
        .stroke-text {
          -webkit-text-stroke: 1px red;
          color: white;
        }
      `}</style>

    </footer>
  );
};

export default Footer;