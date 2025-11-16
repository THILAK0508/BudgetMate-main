import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

const SavingsPlan = () => {
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [activeTab, setActiveTab] = useState('Expenses');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingsSummary, setSavingsSummary] = useState(null);
  const [localIncomeData, setLocalIncomeData] = useState([]);
  const [localExpenseData, setLocalExpenseData] = useState([]);
  const updateTimeoutRef = useRef(null);

  useEffect(() => {
    fetchSavingsData();
  }, []);

  useEffect(() => {
    if (savingsSummary) {
      // Update local state when data is fetched
      setLocalIncomeData(incomeData);
      setLocalExpenseData(expenseData);
      checkAlerts();
    }
  }, [savingsSummary, monthlyBudget]);

  // Calculate totals from local state (for instant updates)
  const calculateLocalTotals = () => {
    const localTotalIncome = localIncomeData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const localTotalMonthlyExpenses = localExpenseData.reduce((sum, item) => sum + (parseFloat(item.perMonth) || 0), 0);
    const localTotalYearlyExpenses = localExpenseData.reduce((sum, item) => sum + (parseFloat(item.perYear) || 0), 0);
    const localMonthlySavings = localTotalIncome - localTotalMonthlyExpenses;

    return {
      totalIncome: localTotalIncome,
      totalMonthlyExpenses: localTotalMonthlyExpenses,
      totalYearlyExpenses: localTotalYearlyExpenses,
      monthlySavings: localMonthlySavings
    };
  };

  const fetchSavingsData = async () => {
    try {
      setLoading(true);
      const summaryResponse = await api.getSavingsSummary();
      
      if (summaryResponse.success) {
        const { income, expenses, budget } = summaryResponse.data;
        setIncomeData(income.breakdown || []);
        setExpenseData(expenses.breakdown || []);
        setLocalIncomeData(income.breakdown || []);
        setLocalExpenseData(expenses.breakdown || []);
        setMonthlyBudget(budget.monthly || 0);
        setSavingsSummary(summaryResponse.data);
      } else {
        setError('Failed to load savings data');
      }
    } catch (err) {
      console.error('Error fetching savings data:', err);
      setError('Failed to load savings data');
    } finally {
      setLoading(false);
    }
  };

  const checkAlerts = () => {
    const totals = calculateLocalTotals();
    const newAlerts = [];
    
    if (monthlyBudget > 0 && totals.totalMonthlyExpenses > monthlyBudget) {
      newAlerts.push(`Monthly expenses (₹${totals.totalMonthlyExpenses.toFixed(2)}) exceed your budget (₹${monthlyBudget.toFixed(2)}) by ₹${(totals.totalMonthlyExpenses - monthlyBudget).toFixed(2)}`);
    }
    
    if (monthlyBudget > 0 && totals.totalIncome > 0 && totals.totalMonthlyExpenses > totals.totalIncome) {
      newAlerts.push(`Monthly expenses (₹${totals.totalMonthlyExpenses.toFixed(2)}) exceed your income (₹${totals.totalIncome.toFixed(2)})`);
    }
    
    setAlerts(newAlerts);
  };

  // Debounced update function
  const debouncedUpdate = (updateFn, delay = 1000) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(updateFn, delay);
  };

  const handleIncomeChange = (id, field, value) => {
    // Update local state immediately for instant UI feedback
    const updated = localIncomeData.map(item => {
      if (item._id === id) {
        return { ...item, [field]: field === 'amount' ? parseFloat(value) || 0 : value };
      }
      return item;
    });
    setLocalIncomeData(updated);
    
    // Debounce the API call
    debouncedUpdate(async () => {
      try {
        const income = updated.find(i => i._id === id);
        if (!income) return;

        const updatedData = { ...income, [field]: field === 'amount' ? parseFloat(value) || 0 : value };
        const response = await api.updateIncome(id, updatedData);

        if (response.success) {
          await fetchSavingsData();
        } else {
          setError(response.message || 'Failed to update income');
          // Revert on error
          setLocalIncomeData(incomeData);
        }
      } catch (err) {
        console.error('Error updating income:', err);
        setError(err.message || 'Failed to update income');
        setLocalIncomeData(incomeData);
      }
    });
  };

  const handleExpenseChange = (id, field, value) => {
    // Update local state immediately
    const updated = localExpenseData.map(item => {
      if (item._id === id) {
        const newItem = { ...item };
        if (field === 'perMonth') {
          newItem.perMonth = parseFloat(value) || 0;
          newItem.perYear = newItem.perMonth * 12;
        } else if (field === 'perYear') {
          newItem.perYear = parseFloat(value) || 0;
          newItem.perMonth = newItem.perYear / 12;
        } else {
          newItem[field] = value;
        }
        return newItem;
      }
      return item;
    });
    setLocalExpenseData(updated);
    
    // Debounce the API call
    debouncedUpdate(async () => {
      try {
        const expense = updated.find(e => e._id === id);
        if (!expense) return;

        const updatedData = {
          ...expense,
          perMonth: expense.perMonth,
          perYear: expense.perYear
        };

        const response = await api.updateSavingsExpense(id, updatedData);

        if (response.success) {
          await fetchSavingsData();
        } else {
          setError(response.message || 'Failed to update expense');
          setLocalExpenseData(expenseData);
        }
      } catch (err) {
        console.error('Error updating expense:', err);
        setError(err.message || 'Failed to update expense');
        setLocalExpenseData(expenseData);
      }
    });
  };

  const addIncomeRow = async () => {
    try {
      setError(null);
      const response = await api.createIncome({
        type: 'Salary',
        amount: 0,
        frequency: 'Monthly'
      });

      if (response.success) {
        await fetchSavingsData();
      } else {
        setError(response.message || 'Failed to add income');
      }
    } catch (err) {
      console.error('Error adding income:', err);
      setError(err.message || 'Failed to add income');
    }
  };

  const addExpenseRow = async () => {
    try {
      setError(null);
      const response = await api.createSavingsExpense({
        category: 'Rent',
        perMonth: 0
      });

      if (response.success) {
        await fetchSavingsData();
      } else {
        setError(response.message || 'Failed to add expense');
      }
    } catch (err) {
      console.error('Error adding expense:', err);
      setError(err.message || 'Failed to add expense');
    }
  };

  const removeIncomeRow = async (id) => {
    if (incomeData.length <= 1) {
      alert('You must have at least one income source');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this income?')) {
      return;
    }

    try {
      const response = await api.deleteIncome(id);
      if (response.success) {
        await fetchSavingsData();
      } else {
        setError(response.message || 'Failed to delete income');
      }
    } catch (err) {
      console.error('Error deleting income:', err);
      setError(err.message || 'Failed to delete income');
    }
  };

  const removeExpenseRow = async (id) => {
    if (expenseData.length <= 1) {
      alert('You must have at least one expense category');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      const response = await api.deleteSavingsExpense(id);
      if (response.success) {
        await fetchSavingsData();
      } else {
        setError(response.message || 'Failed to delete expense');
      }
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError(err.message || 'Failed to delete expense');
    }
  };

  const handleBudgetChange = (value) => {
    const budgetValue = parseFloat(value) || 0;
    setMonthlyBudget(budgetValue);
    
    // Debounce the API call
    debouncedUpdate(async () => {
      try {
        const response = await api.setSavingsBudget(budgetValue);
        if (!response.success) {
          setError(response.message || 'Failed to update budget');
        }
      } catch (err) {
        console.error('Error updating budget:', err);
        setError(err.message || 'Failed to update budget');
      }
    }, 500);
  };

  // Use local totals for instant updates
  const totals = calculateLocalTotals();

  const formatCurrency = (amount) => {
    return `₹ ${(amount || 0).toFixed(2)}`;
  };

  if (loading && incomeData.length === 0 && expenseData.length === 0) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Savings Plan</h1>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-700 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-6">
            {alerts.map((alert, index) => (
              <div key={index} className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-2">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="font-medium">Budget Alert:</span> {alert}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Income Section */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">Income (Monthly)</h2>
              <div className="space-y-3">
                {localIncomeData.length > 0 ? (
                  localIncomeData.map((item) => (
                    <div key={item._id} className="flex gap-2">
                      <select
                        value={item.type}
                        onChange={(e) => handleIncomeChange(item._id, 'type', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="Salary">Salary</option>
                        <option value="Part Time">Part Time</option>
                        <option value="Commissions">Commissions</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Investment">Investment</option>
                        <option value="Other">Other</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Amount..."
                        value={item.amount}
                        onChange={(e) => handleIncomeChange(item._id, 'amount', e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={() => removeIncomeRow(item._id)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No income sources added yet</p>
                )}
                <button
                  onClick={addIncomeRow}
                  className="w-full px-4 py-2 border border-dashed border-gray-300 rounded-md text-gray-500 hover:border-purple-500 hover:text-purple-500"
                >
                  + Add Income Source
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Monthly Income:</span>
                  <span className="text-green-600">{formatCurrency(totals.totalIncome)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-6">
                {['Expenses', 'Needs', 'Vehicles'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-md font-medium ${
                      activeTab === tab
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Expense Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Per Month (₹)</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Per Year (₹)</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {localExpenseData.length > 0 ? (
                      localExpenseData.map((item) => (
                        <tr key={item._id} className="border-b border-gray-100">
                          <td className="py-3 px-4">
                            <select
                              value={item.category}
                              onChange={(e) => handleExpenseChange(item._id, 'category', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="Rent">Rent</option>
                              <option value="Electricity">Electricity</option>
                              <option value="Appliances">Appliances</option>
                              <option value="Food">Food</option>
                              <option value="Transport">Transport</option>
                              <option value="Healthcare">Healthcare</option>
                              <option value="Entertainment">Entertainment</option>
                              <option value="Other">Other</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Amount.."
                              value={item.perMonth}
                              onChange={(e) => handleExpenseChange(item._id, 'perMonth', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Amount.."
                              value={item.perYear?.toFixed(2) || (item.perMonth * 12).toFixed(2)}
                              onChange={(e) => handleExpenseChange(item._id, 'perYear', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => removeExpenseRow(item._id)}
                              className="text-red-600 hover:bg-red-50 rounded-md p-1"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-gray-500">
                          No expenses added yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <button
                  onClick={addExpenseRow}
                  className="w-full mt-4 px-4 py-2 border border-dashed border-gray-300 rounded-md text-gray-500 hover:border-purple-500 hover:text-purple-500"
                >
                  + Add Expense Category
                </button>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Monthly Expenses:</span>
                  <span className="text-red-600">{formatCurrency(totals.totalMonthlyExpenses)}</span>
                </div>
                <div className="flex justify-between items-center font-semibold mt-2">
                  <span>Total Yearly Expenses:</span>
                  <span className="text-red-600">{formatCurrency(totals.totalYearlyExpenses)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Section */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Monthly Spending Limit (Budget)</h2>
          <input
            type="number"
            step="0.01"
            placeholder="Enter your monthly spending limit..."
            value={monthlyBudget}
            onChange={(e) => handleBudgetChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
          />
          <p className="text-sm text-gray-500 mt-2">This is your maximum monthly spending limit. Expenses should not exceed this amount.</p>
        </div>

        {/* Savings Plan Summary */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Your Savings Plan:</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalIncome)}</div>
                <div className="text-sm text-gray-600">Total Monthly Income</div>
                <div className="text-xs text-gray-500 mt-1">Total Amount Added to Account</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.totalMonthlyExpenses)}</div>
                <div className="text-sm text-gray-600">Total Monthly Expenses</div>
                <div className="text-xs text-gray-500 mt-1">Where Money Went</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${totals.monthlySavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totals.monthlySavings)}
                </div>
                <div className="text-sm text-gray-600">Monthly Savings</div>
                <div className="text-xs text-gray-500 mt-1">Income - Expenses</div>
              </div>
            </div>
            
            {monthlyBudget > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-700">Budget Status</div>
                  <div className={`text-xl font-bold mt-2 ${
                    totals.totalMonthlyExpenses <= monthlyBudget ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {totals.totalMonthlyExpenses <= monthlyBudget ? '✓ Within Budget' : '⚠ Over Budget'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Budget (Monthly Limit): {formatCurrency(monthlyBudget)} | 
                    {totals.totalMonthlyExpenses <= monthlyBudget 
                      ? ` Remaining: ${formatCurrency(monthlyBudget - totals.totalMonthlyExpenses)}`
                      : ` Exceeded by: ${formatCurrency(totals.totalMonthlyExpenses - monthlyBudget)}`
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsPlan;
