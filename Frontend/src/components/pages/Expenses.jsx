import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const Expenses = () => {
  const navigate = useNavigate();
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Shopping');
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [savingsBudget, setSavingsBudget] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [budgetAmount, setBudgetAmount] = useState(0);
  const [adding, setAdding] = useState(false);
  const [hasReceipt, setHasReceipt] = useState(false);
  const [receiptFilter, setReceiptFilter] = useState('all'); // 'all', 'with', 'without'

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchExpenses(),
        fetchBudgets(),
        fetchSavingsBudget()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await api.getExpenses({ limit: 50 });
      if (response.success) {
        setExpenses(response.data.expenses || []);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to load expenses');
    }
  };

  const fetchBudgets = async () => {
    try {
      const response = await api.getBudgets({ limit: 100 });
      if (response.success) {
        const budgetList = response.data.budgets || [];
        setBudgets(budgetList);
        
        // If there's a budget matching the selected category, use it
        if (budgetList.length > 0) {
          const matchingBudget = budgetList.find(b => b.category === expenseCategory);
          if (matchingBudget) {
            setSelectedBudget(matchingBudget._id);
            setBudgetAmount(matchingBudget.amount);
          } else {
            setSelectedBudget(budgetList[0]._id);
            setBudgetAmount(budgetList[0].amount);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching budgets:', err);
    }
  };

  const fetchSavingsBudget = async () => {
    try {
      const response = await api.getSavingsBudget();
      if (response.success && response.data) {
        // Response format: { success: true, data: { monthlyBudget: X } }
        setSavingsBudget({
          monthlyBudget: response.data.monthlyBudget || response.data.budget?.monthly || 0
        });
      }
    } catch (err) {
      console.error('Error fetching savings budget:', err);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseName || !expenseAmount) {
      setError('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(expenseAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setAdding(true);
      setError(null);
      
      // Don't send 'savings' as budget ID - it's not a valid MongoDB ObjectId
      // Savings plan budget is tracked separately and doesn't need to be linked here
      const budgetId = selectedBudget && selectedBudget !== 'savings' ? selectedBudget : undefined;
      
      const expenseData = {
        name: expenseName,
        amount: amount,
        category: expenseCategory,
        date: new Date().toISOString(),
        receipt: hasReceipt,
        budget: budgetId
      };

      const response = await api.createExpense(expenseData);
      
      if (response.success) {
        // Refresh all data
        await fetchAllData();
        
        // Clear form
        setExpenseName('');
        setExpenseAmount('');
        setExpenseCategory('Shopping');
        setSelectedBudget('');
        setHasReceipt(false);
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
        successMsg.textContent = 'Expense added successfully!';
        document.body.appendChild(successMsg);
        setTimeout(() => {
          document.body.removeChild(successMsg);
        }, 3000);
      } else {
        setError(response.message || 'Failed to add expense');
      }
    } catch (err) {
      console.error('Error adding expense:', err);
      setError(err.message || 'Failed to add expense');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      const response = await api.deleteExpense(id);
      
      if (response.success) {
        await fetchAllData();
      } else {
        setError(response.message || 'Failed to delete expense');
      }
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError(err.message || 'Failed to delete expense');
    }
  };

  const handleToggleReceipt = async (id, currentReceiptStatus) => {
    try {
      const expense = expenses.find(e => e._id === id);
      if (!expense) return;

      const response = await api.updateExpense(id, {
        receipt: !currentReceiptStatus
      });
      
      if (response.success) {
        await fetchExpenses(); // Refresh expenses list
      } else {
        setError(response.message || 'Failed to update receipt status');
      }
    } catch (err) {
      console.error('Error toggling receipt:', err);
      setError(err.message || 'Failed to update receipt status');
    }
  };

  // Filter expenses by receipt status
  const filteredExpenses = expenses.filter(expense => {
    if (receiptFilter === 'with') return expense.receipt === true;
    if (receiptFilter === 'without') return expense.receipt === false;
    return true; // 'all'
  });

  // Calculate totals from expenses in this category
  const categoryExpenses = expenses.filter(e => e.category === expenseCategory);
  const totalSpent = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remainingAmount = budgetAmount > 0 ? budgetAmount - totalSpent : 0;

  // Get all budgets for dropdown (regular budgets + savings budget if exists)
  const allBudgetsForDropdown = [
    ...budgets.map(b => ({
      id: b._id,
      title: `${b.title} (Budget)`,
      amount: b.amount,
      type: 'budget'
    })),
    ...(savingsBudget ? [{
      id: 'savings',
      title: `Savings Plan Budget (Monthly Limit)`,
      amount: savingsBudget.monthlyBudget,
      type: 'savings'
    }] : [])
  ];

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₹ 0';
    return `₹ ${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-800">MyExpenses</h1>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Budget Overview */}
          <div className="lg:col-span-2">
            {/* Budget Card */}
            {budgetAmount > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">💰</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{expenseCategory}</h3>
                      <p className="text-sm text-gray-500">{categoryExpenses.length} {categoryExpenses.length === 1 ? 'Expense' : 'Expenses'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{formatCurrency(budgetAmount)}</p>
                    <p className="text-xs text-gray-500">Budget Limit</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{formatCurrency(totalSpent)} Spent</span>
                    <span className={`font-medium ${remainingAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(remainingAmount))} {remainingAmount >= 0 ? 'Remaining' : 'Over Budget'}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        (totalSpent / budgetAmount) * 100 >= 90 ? 'bg-red-500' :
                        (totalSpent / budgetAmount) * 100 >= 70 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min((totalSpent / budgetAmount) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Latest Expenses Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">All Expenses</h3>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Filter by receipt:</label>
                  <select
                    value={receiptFilter}
                    onChange={(e) => setReceiptFilter(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Expenses</option>
                    <option value="with">With Receipt</option>
                    <option value="without">Without Receipt</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredExpenses.length > 0 ? (
                      filteredExpenses.map((expense) => (
                        <tr key={expense._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {expense.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{expense.category}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(expense.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <button 
                              onClick={() => handleDeleteExpense(expense._id)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => handleToggleReceipt(expense._id, expense.receipt)}
                          className={`w-8 h-6 rounded flex items-center justify-center transition-colors ${
                            expense.receipt ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                          title={expense.receipt ? 'Click to mark as no receipt' : 'Click to mark as has receipt'}
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          {expenses.length === 0 
                            ? 'No expenses to display. Add your first expense below!'
                            : `No expenses found with ${receiptFilter === 'with' ? 'receipts' : receiptFilter === 'without' ? 'no receipts' : 'the selected filter'}.`
                          }
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Add Expense Form */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Add Expense</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expense Name *
                  </label>
                  <input
                    type="text"
                    value={expenseName}
                    onChange={(e) => setExpenseName(e.target.value)}
                    placeholder="e.g Bedroom Decor"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expense Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="e.g 1000"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => {
                      setExpenseCategory(e.target.value);
                      // Auto-select matching budget if available
                      const matchingBudget = budgets.find(b => b.category === e.target.value);
                      if (matchingBudget) {
                        setSelectedBudget(matchingBudget._id);
                        setBudgetAmount(matchingBudget.amount);
                      } else {
                        setSelectedBudget('');
                        setBudgetAmount(0);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Shopping">Shopping</option>
                    <option value="Rent">Rent</option>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link to Budget (Optional)
                  </label>
                  <select
                    value={selectedBudget}
                    onChange={(e) => {
                      setSelectedBudget(e.target.value);
                      const budget = allBudgetsForDropdown.find(b => b.id === e.target.value);
                      if (budget) {
                        setBudgetAmount(budget.amount);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">None - Don't link to budget</option>
                    {allBudgetsForDropdown.length > 0 ? (
                      allBudgetsForDropdown.map((budget) => (
                        <option key={budget.id} value={budget.id}>
                          {budget.title} - {formatCurrency(budget.amount)}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No budgets available. Create a budget first.</option>
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Linking to a budget will track spending against that budget limit. Note: Savings Plan Budget is shown for reference but cannot be directly linked (it's tracked separately in Savings Plan).
                  </p>
                </div>

                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasReceipt}
                      onChange={(e) => setHasReceipt(e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      I have a receipt for this expense
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Mark this if you have a receipt/documentation for this expense
                  </p>
                </div>

                <button
                  onClick={handleAddExpense}
                  disabled={adding || !expenseName || !expenseAmount}
                  className={`w-full py-3 px-4 rounded-lg transition-colors font-medium ${
                    adding || !expenseName || !expenseAmount
                      ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {adding ? 'Adding...' : 'Add New Expense'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
