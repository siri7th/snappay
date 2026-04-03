import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

interface InfoPageProps {
  title: string;
  description: string;
}

const InfoPage: React.FC<InfoPageProps> = ({ title, description }) => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{title}</h1>
        <p className="text-gray-600 mb-6">{description}</p>

        <div className="space-y-3 text-gray-700 leading-relaxed">
          <p>
            This page is available for project completeness and user navigation. You can later
            replace this content with your final detailed policy or product copy.
          </p>
          <p>
            For now, if you need immediate assistance, please use the support/contact details
            provided in the app footer.
          </p>
        </div>

        <div className="mt-8">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InfoPage;

