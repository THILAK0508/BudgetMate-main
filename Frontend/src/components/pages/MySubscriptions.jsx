import React, { useState, useEffect } from 'react';
import { PlusCircle, Pencil, Trash2, BadgeCheck, Link2, Calendar, DollarSign, TrendingUp, X } from 'lucide-react';
import api from '../../services/api';

const MySubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [formData, setFormData] = useState({ 
    name: '', 
    plan: '', 
    totalSpend: '', 
    duration: '', 
    recurringPayment: 'Yes', 
    category: 'Other',
    linkToSavingsPlan: false,
    monthlyAmount: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [totalMonthlyCost, setTotalMonthlyCost] = useState(0);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    // Calculate total monthly cost from recurring subscriptions
    const monthly = subscriptions
      .filter(sub => sub.recurringPayment === 'Yes' && sub.linkToSavingsPlan)
      .reduce((sum, sub) => sum + (sub.monthlyAmount || 0), 0);
    setTotalMonthlyCost(monthly);
  }, [subscriptions]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await api.getSubscriptions({ limit: 100 });
      
      if (response.success) {
        setSubscriptions(response.data.subscriptions || []);
      } else {
        setError('Failed to load subscriptions');
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdate = async () => {
    if (!formData.name || !formData.plan) {
      setError('Name and plan are required');
      return;
    }

    if (formData.linkToSavingsPlan && (!formData.monthlyAmount || parseFloat(formData.monthlyAmount) <= 0)) {
      setError('Monthly amount is required when linking to savings plan');
      return;
    }

    try {
      setError(null);
      const subscriptionData = {
        ...formData,
        totalSpend: parseFloat(formData.totalSpend) || 0,
        monthlyAmount: formData.linkToSavingsPlan ? parseFloat(formData.monthlyAmount) : 0
      };

      let response;
      if (editingId) {
        response = await api.updateSubscription(editingId, subscriptionData);
      } else {
        response = await api.createSubscription(subscriptionData);
      }

      if (response.success) {
        await fetchSubscriptions();
        resetForm();
        setShowForm(false);
      } else {
        setError(response.message || 'Failed to save subscription');
      }
    } catch (err) {
      console.error('Error saving subscription:', err);
      setError(err.message || 'Failed to save subscription');
    }
  };

  const handleEdit = (sub) => {
    setFormData({
      name: sub.name,
      plan: sub.plan,
      totalSpend: sub.totalSpend.toString(),
      duration: sub.duration,
      recurringPayment: sub.recurringPayment,
      category: sub.category || 'Other',
      linkToSavingsPlan: sub.linkToSavingsPlan || false,
      monthlyAmount: sub.monthlyAmount ? sub.monthlyAmount.toString() : ''
    });
    setEditingId(sub._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) {
      return;
    }

    try {
      const response = await api.deleteSubscription(id);
      
      if (response.success) {
        await fetchSubscriptions();
      } else {
        setError(response.message || 'Failed to delete subscription');
      }
    } catch (err) {
      console.error('Error deleting subscription:', err);
      setError(err.message || 'Failed to delete subscription');
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      plan: '', 
      totalSpend: '', 
      duration: '', 
      recurringPayment: 'Yes', 
      category: 'Other',
      linkToSavingsPlan: false,
      monthlyAmount: ''
    });
    setEditingId(null);
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₹ 0';
    return `₹ ${amount.toLocaleString('en-IN')}`;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Streaming': 'bg-pink-100 text-pink-700 border-pink-200',
      'Software': 'bg-blue-100 text-blue-700 border-blue-200',
      'Gym': 'bg-green-100 text-green-700 border-green-200',
      'Music': 'bg-purple-100 text-purple-700 border-purple-200',
      'News': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Other': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[category] || colors['Other'];
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Streaming': '📺',
      'Software': '💻',
      'Gym': '💪',
      'Music': '🎵',
      'News': '📰',
      'Other': '📦'
    };
    return icons[category] || icons['Other'];
  };

  if (loading && subscriptions.length === 0) {
    return (
      <div className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <BadgeCheck className="w-8 h-8 text-purple-600" /> My Subscriptions
              </h1>
              <p className="text-gray-600">Manage your recurring subscriptions and track monthly costs</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="mt-4 sm:mt-0 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              <PlusCircle className="w-5 h-5" />
              {showForm ? 'Cancel' : 'Add Subscription'}
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Subscriptions</p>
                  <p className="text-2xl font-bold text-gray-900">{subscriptions.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <BadgeCheck className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Monthly Cost (Linked)</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalMonthlyCost)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Recurring</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {subscriptions.filter(sub => sub.recurringPayment === 'Yes').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-center justify-between">
            <p className="text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Subscription Form */}
        {showForm && (
          <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? 'Edit Subscription' : 'Add New Subscription'}
              </h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                <input 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
                  placeholder="e.g., Netflix" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Plan *</label>
                <input 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
                  placeholder="e.g., Premium Plan" 
                  value={formData.plan} 
                  onChange={e => setFormData({ ...formData, plan: e.target.value })} 
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Total Spend</label>
                <input 
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
                  placeholder="₹1000" 
                  value={formData.totalSpend} 
                  onChange={e => setFormData({ ...formData, totalSpend: e.target.value })} 
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                <input 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
                  placeholder="e.g., 12 months" 
                  value={formData.duration} 
                  onChange={e => setFormData({ ...formData, duration: e.target.value })} 
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Recurring</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
                  value={formData.recurringPayment} 
                  onChange={e => setFormData({ ...formData, recurringPayment: e.target.value })}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
                  value={formData.category} 
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Streaming">Streaming</option>
                  <option value="Software">Software</option>
                  <option value="Gym">Gym</option>
                  <option value="Music">Music</option>
                  <option value="News">News</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Link to Savings Plan Section */}
              <div className="sm:col-span-2 lg:col-span-3 border-t pt-4 mt-2">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="checkbox"
                      id="linkToSavingsPlan"
                      checked={formData.linkToSavingsPlan}
                      onChange={e => setFormData({ ...formData, linkToSavingsPlan: e.target.checked, monthlyAmount: e.target.checked ? formData.monthlyAmount : '' })}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="linkToSavingsPlan" className="flex items-center gap-2 text-sm font-semibold text-purple-900 cursor-pointer">
                      <Link2 className="w-4 h-4" />
                      Link to Savings Plan (Auto-deduct from monthly budget)
                    </label>
                  </div>
                  {formData.linkToSavingsPlan && (
                    <div className="ml-7">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Monthly Amount *</label>
                      <input 
                        type="number"
                        step="0.01"
                        className="w-full p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
                        placeholder="Enter monthly amount (e.g., 299)" 
                        value={formData.monthlyAmount} 
                        onChange={e => setFormData({ ...formData, monthlyAmount: e.target.value })} 
                      />
                      <p className="text-xs text-gray-600 mt-2">
                        This amount will be automatically deducted from your monthly budget in Savings Plan
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md" 
                  onClick={handleAddOrUpdate}
                >
                  <div className="flex items-center gap-2">
                    <PlusCircle className="w-5 h-5" />
                    {editingId ? 'Update Subscription' : 'Add Subscription'}
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Grid */}
        {subscriptions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.map(sub => (
              <div 
                key={sub._id} 
                className="bg-white rounded-xl border border-gray-200 p-6 relative hover:shadow-lg transition-all duration-300 group"
              >
                {/* Linked Badge */}
                {sub.linkToSavingsPlan && (
                  <div className="absolute top-3 left-3 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 z-10">
                    <Link2 className="w-3 h-3" />
                    Linked
                  </div>
                )}

                {/* Action Buttons */}
                <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button 
                    onClick={() => handleEdit(sub)} 
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-all"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(sub._id)} 
                    className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Category Icon */}
                <div className="mb-4">
                  <span className="text-4xl">{getCategoryIcon(sub.category)}</span>
                </div>

                {/* Subscription Info */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 pr-20">{sub.name}</h3>
                <p className="text-sm text-gray-600 mb-1">Plan: <span className="font-semibold text-gray-800">{sub.plan}</span></p>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Spend:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(sub.totalSpend)}</span>
                  </div>
                  {sub.linkToSavingsPlan && sub.monthlyAmount && (
                    <div className="flex items-center justify-between bg-green-50 p-2 rounded">
                      <span className="text-sm text-green-700 font-medium">Monthly (Linked):</span>
                      <span className="font-bold text-green-700">{formatCurrency(sub.monthlyAmount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="font-semibold text-gray-800">{sub.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Recurring:</span>
                    <span className={`font-semibold ${sub.recurringPayment === 'Yes' ? 'text-green-600' : 'text-gray-600'}`}>
                      {sub.recurringPayment}
                    </span>
                  </div>
                </div>

                {/* Category Badge */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(sub.category)}`}>
                    {sub.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <BadgeCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No subscriptions added yet</p>
            <p className="text-gray-400 text-sm mb-6">Add your first subscription to start tracking</p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
            >
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Add Subscription
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySubscriptions;
