import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';

const Budget = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Shopping',
    icon: '💰',
    color: 'blue'
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await api.getBudgets({ limit: 100 });
      
      if (response.success) {
        setBudgetData(response.data.budgets || []);
      } else {
        setError('Failed to load budgets');
      }
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = (file) => {
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      setUploadedFile(file);
      // Here you would typically upload the file to your backend
      console.log('File uploaded:', file.name);
    } else {
      alert('Please upload an image or PDF file');
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleSubmitBudget = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const response = await api.createBudget({
        ...formData,
        amount: parseFloat(formData.amount)
      });

      if (response.success) {
        await fetchBudgets();
        setShowForm(false);
        setFormData({
          title: '',
          amount: '',
          category: 'Shopping',
          icon: '💰',
          color: 'blue'
        });
      } else {
        setError(response.message || 'Failed to create budget');
      }
    } catch (err) {
      console.error('Error creating budget:', err);
      setError(err.message || 'Failed to create budget');
    }
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) {
      return;
    }

    try {
      const response = await api.deleteBudget(id);
      
      if (response.success) {
        await fetchBudgets();
      } else {
        setError(response.message || 'Failed to delete budget');
      }
    } catch (err) {
      console.error('Error deleting budget:', err);
      setError(err.message || 'Failed to delete budget');
    }
  };

  const calculateProgress = (spent, total) => {
    if (!total || total === 0) return 0;
    return (spent / total) * 100;
  };

  const getProgressColor = (progress) => {
    if (progress >= 90) return 'bg-red-500';
    if (progress >= 70) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Shopping': 'bg-pink-100',
      'Food': 'bg-orange-100',
      'Transport': 'bg-blue-100',
      'Entertainment': 'bg-purple-100',
      'Healthcare': 'bg-red-100',
      'Education': 'bg-green-100',
      'Home': 'bg-yellow-100',
      'Other': 'bg-gray-100'
    };
    return colors[category] || 'bg-gray-100';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Shopping': '🛍️',
      'Food': '🍔',
      'Transport': '🚗',
      'Entertainment': '🎬',
      'Healthcare': '🏥',
      'Education': '📚',
      'Home': '🏠',
      'Other': '💰'
    };
    return icons[category] || '💰';
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₹ 0';
    return `₹ ${amount.toLocaleString('en-IN')}`;
  };

  if (loading && budgetData.length === 0) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Budgets</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add Budget'}
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {showForm && (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Budget</h2>
            <form onSubmit={handleSubmitBudget} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g Shopping"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="e.g 5000"
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      category: e.target.value,
                      icon: getCategoryIcon(e.target.value)
                    });
                  }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Shopping">Shopping</option>
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Home">Home</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g 🛍️"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Create Budget
                </button>
              </div>
            </form>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Upload Receipt Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-300 hover:border-purple-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload receipts</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Drag and drop your receipts here, or click to browse
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Browse Files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
              </div>
              
              {uploadedFile && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-800 font-medium">
                      {uploadedFile.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Budget Cards */}
          {budgetData.length > 0 ? (
            budgetData.map((budget) => {
              const progress = calculateProgress(budget.spent, budget.amount);
              const itemCount = budget.spent > 0 ? 1 : 0; // This would need to come from expense count
              
              return (
                <div key={budget._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 ${getCategoryColor(budget.category)} rounded-full flex items-center justify-center text-xl`}>
                        {budget.icon || getCategoryIcon(budget.category)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{budget.title}</h3>
                        <p className="text-sm text-gray-500">{itemCount} {itemCount === 1 ? 'Item' : 'Items'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">{formatCurrency(budget.amount)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Spent</span>
                      <span className="font-medium">{formatCurrency(budget.spent)}</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining</span>
                      <span className="font-medium text-green-600">{formatCurrency(budget.remaining)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {Math.round(progress)}% used
                      </span>
                      <button 
                        onClick={() => handleDeleteBudget(budget._id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              <p>No budgets created yet. Click "Add Budget" to create one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Budget;
