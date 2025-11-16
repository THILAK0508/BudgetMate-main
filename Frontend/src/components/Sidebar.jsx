// components/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Receipt, 
  PiggyBank, 
  CreditCard, 
  BarChart3, 
  User,
  LogOut,
  Wallet
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Expenses', href: '/expenses', icon: Receipt },
    { name: 'Savings Plan', href: '/savings-plan', icon: PiggyBank },
    { name: 'My Subscriptions', href: '/subscriptions', icon: CreditCard },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    // The App component will handle the redirect
  };

  return (
    <div className="flex flex-col w-64 bg-white border-r border-neutral-200">
      {/* Logo/Brand */}
      <div className="flex items-center justify-center h-20 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-semibold text-neutral-900 tracking-tight">BudgetMate</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActivePath(item.href)
                  ? 'bg-neutral-100 text-neutral-900 border-l-4 border-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
            {user?.profilePicture ? (
              <img 
                src={user.profilePicture} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-neutral-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900">
              {user?.username || 'User'}
            </p>
            <p className="text-xs text-neutral-500">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors duration-200"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;