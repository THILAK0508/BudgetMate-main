import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [savingsData, setSavingsData] = useState(null);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month'); // month or year

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both dashboard overview and savings summary
      const [dashboardResponse, savingsResponse] = await Promise.all([
        api.getDashboardOverview(period),
        api.getSavingsSummary().catch(() => null) // Don't fail if savings data unavailable
      ]);
      
      if (dashboardResponse.success) {
        setDashboardData(dashboardResponse.data);
      } else {
        setError('Failed to load dashboard data');
      }
      
      if (savingsResponse?.success) {
        setSavingsData(savingsResponse.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-2 text-sm text-red-700 underline"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  const { overview, recent, breakdowns } = dashboardData || {};
  const { expenses: recentExpenses = [], budgets: recentBudgets = [] } = recent || {};
  const { categoryExpenses = {} } = breakdowns || {};

  // Combine budget totals with savings budget if available
  const totalBudgetFromBudgets = overview?.totalBudget || 0;
  const savingsMonthlyBudget = savingsData?.budget?.monthly || 0;
  const totalBudget = totalBudgetFromBudgets + savingsMonthlyBudget;
  
  // Total spent from actual expenses (from Expenses table)
  const totalSpentFromExpenses = overview?.totalExpenses || 0; // Actual expenses from Expenses table
  
  // Include savings expenses (which include subscription-linked expenses) in total spent
  const savingsMonthlyExpenses = savingsData?.expenses?.monthly || 0; // Savings expenses (includes subscription-linked)
  
  // Total actual expenses = Regular expenses + Savings expenses (including subscription-linked)
  const actualMonthlyExpenses = totalSpentFromExpenses + savingsMonthlyExpenses;
  
  // Savings info from Savings Plan
  const totalIncome = savingsData?.income?.total || 0; // Income from Savings Plan (correct)
  
  // Calculate monthly savings using ACTUAL expenses (regular + savings/subscription expenses)
  // Monthly Savings = Income (from Savings Plan) - Actual Expenses (from Expenses table + Savings expenses)
  const monthlySavings = totalIncome - actualMonthlyExpenses; // Calculate correctly

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₹ -----';
    return `₹ ${amount.toLocaleString('en-IN')}`;
  };

  // Get category colors for activity chart
  const getCategoryColor = (index) => {
    const colors = ['bg-purple-300', 'bg-purple-400', 'bg-purple-600', 'bg-purple-500', 'bg-purple-400'];
    return colors[index % colors.length];
  };

  // Prepare activity chart data (top 5 categories)
  // Include savings expenses in the total for chart calculations
  const activityCategories = Object.entries(categoryExpenses || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, amount], index) => ({
      name,
      amount,
      height: Math.min((amount / (actualMonthlyExpenses || 1)) * 300, 300),
      color: getCategoryColor(index)
    }));

  return (
    <main className="flex-1 p-8">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between mb-8">
        <p className="text-gray-600">Here's what happening with your money. Let's manage your Expenses.</p>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'month'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'year'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Budget */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Budget ({period === 'month' ? 'Monthly' : 'Yearly'})</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(period === 'month' ? totalBudget : totalBudget * 12)}</p>
              {savingsMonthlyBudget > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Includes: {formatCurrency(totalBudgetFromBudgets)} from budgets + {formatCurrency(savingsMonthlyBudget)} from savings plan
                </p>
              )}
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Spend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Spent ({period === 'month' ? 'Monthly' : 'Yearly'})</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(period === 'month' ? actualMonthlyExpenses : actualMonthlyExpenses * 12)}</p>
              <p className="text-xs text-gray-400 mt-1">
                Where money went
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Savings or Budget Count */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Monthly Savings</p>
              <p className={`text-2xl font-bold ${monthlySavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(monthlySavings)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Income - Actual Expenses = {formatCurrency(totalIncome)} - {formatCurrency(actualMonthlyExpenses)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Income Summary Card */}
      {totalIncome > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Monthly Income</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(totalIncome)}</p>
              <p className="text-xs text-gray-500">Total amount added to account</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Monthly Expenses</p>
              <p className="text-xl font-bold text-red-700">{formatCurrency(actualMonthlyExpenses)}</p>
              <p className="text-xs text-gray-500">Actual expenses (where money went)</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Monthly Savings</p>
              <p className={`text-xl font-bold ${monthlySavings >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(monthlySavings)}
              </p>
              <p className="text-xs text-gray-500">Income - Actual Expenses</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Budget Status</p>
              {savingsMonthlyBudget > 0 ? (
                <>
                  <p className={`text-xl font-bold ${actualMonthlyExpenses <= savingsMonthlyBudget ? 'text-green-700' : 'text-red-700'}`}>
                    {actualMonthlyExpenses <= savingsMonthlyBudget ? '✓ Within' : '⚠ Over'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Limit: {formatCurrency(savingsMonthlyBudget)} | Spent: {formatCurrency(actualMonthlyExpenses)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">Set budget in Savings Plan</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Chart */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Activity ({period === 'month' ? 'Monthly' : 'Yearly'})</h3>
            <p className="text-sm text-gray-500 mb-6">Expense breakdown by category</p>
            {activityCategories.length > 0 ? (
              <>
                <div className="h-64 flex items-end justify-center space-x-4">
                  {activityCategories.map((category, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className={`w-16 ${category.color} rounded-t mb-2 transition-all duration-300`}
                        style={{height: `${category.height}px`, minHeight: '20px'}}
                        title={`${category.name}: ${formatCurrency(category.amount)}`}
                      ></div>
                      <span className="text-xs text-gray-500 text-center max-w-[60px] truncate">{category.name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center mt-4 space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-600 rounded"></div>
                    <span className="text-sm text-gray-600">Total Spent</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No expense data available for this period</p>
                <p className="text-sm mt-2">Start adding expenses to see activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Latest Budgets */}
        <div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Latest Budgets</h3>
            <p className="text-sm text-gray-500 mb-6">Your spending limits</p>
            <div className="space-y-4">
              {recentBudgets.length > 0 ? (
                recentBudgets.slice(0, 5).map((budget) => (
                  <div key={budget.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{budget.icon || '💰'}</span>
                        <div>
                          <p className="font-medium text-gray-800">{budget.title}</p>
                          <p className="text-xs text-gray-500">{budget.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-800">{formatCurrency(budget.amount)}</p>
                        <p className="text-xs text-gray-500">Spent: {formatCurrency(budget.spent)}</p>
                        <p className="text-xs text-green-600">Left: {formatCurrency(budget.remaining)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : savingsMonthlyBudget > 0 ? (
                <div className="border-b border-gray-100 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Savings Plan Budget</p>
                      <p className="text-xs text-gray-500">Monthly Spending Limit</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">{formatCurrency(savingsMonthlyBudget)}</p>
                      <p className="text-xs text-gray-500">Spent: {formatCurrency(actualMonthlyExpenses)}</p>
                      <p className={`text-xs ${actualMonthlyExpenses <= savingsMonthlyBudget ? 'text-green-600' : 'text-red-600'}`}>
                        {actualMonthlyExpenses <= savingsMonthlyBudget 
                          ? `Left: ${formatCurrency(savingsMonthlyBudget - actualMonthlyExpenses)}`
                          : `Over: ${formatCurrency(actualMonthlyExpenses - savingsMonthlyBudget)}`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No budgets to display</p>
                  <p className="text-xs mt-2">Create budgets or set savings plan budget</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expense Table */}
      <div className="mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Recent Expenses ({period === 'month' ? 'This Month' : 'This Year'})</h3>
            <span className="text-sm text-gray-500">{recentExpenses.length} expenses</span>
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentExpenses.length > 0 ? (
                  recentExpenses.map((expense) => {
                    const expenseDate = new Date(expense.date);
                    const formattedDate = expenseDate.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    });
                    
                    return (
                      <tr key={expense.id} className="hover:bg-gray-50">
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
                          {formattedDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button className="text-red-600 hover:text-red-800" title="Delete expense">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No recent expenses to display for this period
                      <p className="text-sm mt-2">Add expenses to see them here</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
