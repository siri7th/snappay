// pages/primary/Support.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChatBubbleLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XMarkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { APP_CONFIG } from '../../utils/constants';
import toast from 'react-hot-toast';

interface FAQ {
  q: string;
  a: string;
  category?: string;
}

const Support: React.FC = () => {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{text: string, sender: 'user' | 'support'}>>([
    { text: 'Hi! How can I help you today?', sender: 'support' }
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const faqs: FAQ[] = [
    {
      q: 'How do I add a family member?',
      a: 'Go to Family Management → Add Member → Choose QR/SMS/Manual. You can invite family members by generating a QR code, sending an SMS invite, or manually entering their details.',
      category: 'family'
    },
    {
      q: 'What are spending limits?',
      a: 'You can set daily, monthly, and per-transaction limits for each family member. These limits help you control spending and can be adjusted anytime from the member details page.',
      category: 'limits'
    },
    {
      q: 'How to add money to wallet?',
      a: 'Go to Wallet → Add Money → Select bank and amount. Funds are transferred instantly from your linked bank account to your SnapPay wallet.',
      category: 'wallet'
    },
    {
      q: 'Transaction failed?',
      a: 'Check your internet connection and try again. If the issue persists, verify that you have sufficient balance and that the recipient details are correct. Contact support if the problem continues.',
      category: 'transactions'
    },
    {
      q: 'How do I connect to a primary account?',
      a: 'As a linked user, you can connect to a primary account by scanning their QR code, entering an invite code, or requesting connection via phone number.',
      category: 'connection'
    },
    {
      q: 'How to verify my bank account?',
      a: 'After adding a bank account, we send a small deposit (₹1-2) to verify ownership. Enter the amount in the app to complete verification. This usually takes 1-2 business days.',
      category: 'bank'
    },
    {
      q: 'Can I change my account type?',
      a: 'Your account type (Primary/Linked) is permanent. However, you can create a new account with a different type using the same phone number.',
      category: 'account'
    },
    {
      q: 'How do I request a limit increase?',
      a: 'Linked users can request a limit increase from their dashboard. The primary account holder will receive a notification and can approve or deny the request.',
      category: 'limits'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Questions' },
    { id: 'family', name: 'Family Management' },
    { id: 'limits', name: 'Limits' },
    { id: 'wallet', name: 'Wallet' },
    { id: 'transactions', name: 'Transactions' },
    { id: 'connection', name: 'Connection' },
    { id: 'bank', name: 'Bank Accounts' },
    { id: 'account', name: 'Account' }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Add user message
    setChatMessages(prev => [...prev, { text: message, sender: 'user' }]);
    
    // Simulate support response
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        text: 'Thank you for your message. A support representative will respond shortly. For immediate assistance, please call our support line.', 
        sender: 'support' 
      }]);
    }, 1000);
    
    setMessage('');
  };

  const handleContact = (type: 'chat' | 'call' | 'email') => {
    switch (type) {
      case 'chat':
        setChatOpen(true);
        break;
      case 'call':
        window.location.href = `tel:${APP_CONFIG.SUPPORT_PHONE}`;
        break;
      case 'email':
        window.location.href = `mailto:${APP_CONFIG.SUPPORT_EMAIL}`;
        break;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/primary/settings')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
          <p className="text-sm text-gray-500 mt-1">Get help with your account and questions</p>
        </div>
      </div>

      {/* Contact Options */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className="text-center p-6 hover:shadow-lg cursor-pointer transition-all hover:scale-105"
          onClick={() => handleContact('chat')}
        >
          <ChatBubbleLeftIcon className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold">Live Chat</h3>
          <p className="text-xs text-gray-500 mt-1">9AM - 9PM</p>
        </Card>
        
        <Card 
          className="text-center p-6 hover:shadow-lg cursor-pointer transition-all hover:scale-105"
          onClick={() => handleContact('call')}
        >
          <PhoneIcon className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold">Call Us</h3>
          <p className="text-xs text-gray-500 mt-1">{APP_CONFIG.SUPPORT_PHONE}</p>
        </Card>
        
        <Card 
          className="text-center p-6 hover:shadow-lg cursor-pointer transition-all hover:scale-105"
          onClick={() => handleContact('email')}
        >
          <EnvelopeIcon className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold">Email</h3>
          <p className="text-xs text-gray-500 mt-1">{APP_CONFIG.SUPPORT_EMAIL}</p>
        </Card>
        
        <Card 
          className="text-center p-6 hover:shadow-lg cursor-pointer transition-all hover:scale-105"
          onClick={() => {
            const element = document.getElementById('faq-section');
            element?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <DocumentTextIcon className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold">FAQ</h3>
          <p className="text-xs text-gray-500 mt-1">Quick answers</p>
        </Card>
      </div>

      {/* FAQ Section */}
      <div id="faq-section">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              leftIcon={<QuestionMarkCircleIcon className="h-4 w-4 text-gray-400" />}
            />
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* FAQ List */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, i) => (
                <Card key={i} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex gap-3">
                    <QuestionMarkCircleIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-gray-900">{faq.q}</h3>
                      <p className="text-sm text-gray-600 mt-1">{faq.a}</p>
                      {faq.category && (
                        <span className="inline-block mt-2 text-xs bg-primary-soft text-primary px-2 py-1 rounded-full">
                          {categories.find(c => c.id === faq.category)?.name || faq.category}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No FAQs found matching your search</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Report Issue */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Report an Issue</h2>
        <div className="space-y-4">
          <select 
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
            defaultValue=""
          >
            <option value="" disabled>Select issue type</option>
            <option value="transaction">Transaction failed</option>
            <option value="money">Money not received</option>
            <option value="app">App not working</option>
            <option value="family">Family member issue</option>
            <option value="bank">Bank account issue</option>
            <option value="other">Other</option>
          </select>

          <Input placeholder="Transaction ID (if applicable)" />

          <textarea
            placeholder="Describe the issue in detail..."
            rows={4}
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none resize-none"
          />

          <div className="flex gap-3">
            <Button fullWidth>Submit Report</Button>
            <Button variant="outline" fullWidth>Cancel</Button>
          </div>
        </div>
      </Card>

      {/* Contact Info */}
      <Card className="bg-primary-soft border-primary/20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <PhoneIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">24/7 Support</p>
              <p className="font-semibold">{APP_CONFIG.SUPPORT_PHONE}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <EnvelopeIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Email Support</p>
              <p className="font-semibold">{APP_CONFIG.SUPPORT_EMAIL}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Live Chat Modal */}
      {chatOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-0 overflow-hidden">
            <div className="bg-primary text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ChatBubbleLeftIcon className="h-5 w-5" />
                <span className="font-semibold">Live Chat Support</span>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="h-80 p-4 overflow-y-auto bg-gray-50">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-3 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-primary text-white rounded-br-none'
                        : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 p-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
              <Button 
                size="sm" 
                onClick={handleSendMessage}
                disabled={!message.trim()}
              >
                <PaperAirplaneIcon className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Support;