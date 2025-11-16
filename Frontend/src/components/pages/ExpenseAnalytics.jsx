import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, IndianRupee, Calendar, Filter, Download, Eye } from 'lucide-react';
import api from '../../services/api';

const ExpenseAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // month or year
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenseData, setExpenseData] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);

  useEffect(() => {
    fetchAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get expenses, dashboard data, and savings data
      const [expensesResponse, dashboardResponse, savingsResponse] = await Promise.all([
        api.getExpenses({ limit: 1000 }),
        api.getDashboardOverview(selectedPeriod),
        api.getSavingsSummary().catch(() => null)
      ]);

      if (expensesResponse.success && dashboardResponse.success) {
        processExpenseData(expensesResponse.data.expenses || [], dashboardResponse.data, savingsResponse?.data);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const processExpenseData = (expenses, dashboardData, savingsData) => {
    // Get category breakdown from dashboard
    const categoryExpenses = dashboardData?.breakdowns?.categoryExpenses || {};
    const monthlyTrendsData = dashboardData?.breakdowns?.monthlyTrends || [];
    const budgets = dashboardData?.recent?.budgets || [];

    // Get savings budget
    const savingsBudget = savingsData?.budget?.monthly || 0;
    const savingsExpenses = savingsData?.expenses?.monthly || 0;

    // Convert category expenses to array format for charts
    const expenseDataArray = Object.entries(categoryExpenses).map(([category, amount]) => {
      // Find budget for this category
      const budget = budgets.find(b => b.category === category);
      const budgetAmount = budget?.amount || 0;
      
      // Calculate last year estimate (90% of current for demo)
      const lastYear = amount * 0.9;
      
      // Calculate variance (Budget - Actual Spent)
      const variance = budgetAmount - amount;
      const variancePercentage = budgetAmount > 0 ? ((variance / budgetAmount) * 100) : 0;
      
      return {
        category,
        actual: amount, // What was actually spent
        budget: budgetAmount, // Spending limit for this category
        spent: amount, // Same as actual (what was spent)
        remaining: budgetAmount - amount, // Budget - Actual
        lastYear,
        variance,
        variancePercentage,
        description: getCategoryDescription(category)
      };
    });

    // Add overall savings budget as a category if it exists
    if (savingsBudget > 0) {
      expenseDataArray.push({
        category: 'Overall (Savings Plan)',
        actual: savingsExpenses,
        budget: savingsBudget,
        spent: savingsExpenses,
        remaining: savingsBudget - savingsExpenses,
        lastYear: savingsExpenses * 0.9,
        variance: savingsBudget - savingsExpenses,
        variancePercentage: ((savingsBudget - savingsExpenses) / savingsBudget) * 100,
        description: 'Monthly spending limit from savings plan'
      });
    }

    // Sort by actual amount descending
    expenseDataArray.sort((a, b) => b.actual - a.actual);

    setExpenseData(expenseDataArray);

    // Process monthly trends
    const processedMonthlyTrends = monthlyTrendsData.map(trend => ({
      month: trend.month,
      actual: trend.amount,
      spent: trend.amount
    }));

    setMonthlyTrends(processedMonthlyTrends);
  };

  const getCategoryDescription = (category) => {
    const descriptions = {
      'Shopping': 'Clothes, electronics, misc',
      'Food': 'Groceries, dining out',
      'Transport': 'Gas, public transit, car maintenance',
      'Entertainment': 'Movies, subscriptions, hobbies',
      'Healthcare': 'Insurance, medical bills',
      'Education': 'Books, courses, training',
      'Home': 'Rent, utilities, maintenance',
      'Other': 'Miscellaneous expenses',
      'Overall (Savings Plan)': 'Monthly spending limit from savings plan'
    };
    return descriptions[category] || 'Expenses';
  };

  const categoryColors = {
    'Shopping': '#EC4899',
    'Food': '#10B981',
    'Transport': '#F59E0B',
    'Entertainment': '#8B5CF6',
    'Healthcare': '#EF4444',
    'Education': '#06B6D4',
    'Home': '#3B82F6',
    'Other': '#84CC16',
    'Overall (Savings Plan)': '#6366F1'
  };

  const pieChartData = expenseData.map(item => ({
    name: item.category,
    value: item.actual,
    percentage: ((item.actual / expenseData.reduce((sum, d) => sum + d.actual, 0)) * 100).toFixed(1)
  }));

  const totalActual = expenseData.reduce((sum, item) => sum + item.actual, 0);
  const totalBudget = expenseData.reduce((sum, item) => sum + item.budget, 0);
  const totalRemaining = expenseData.reduce((sum, item) => sum + (item.remaining || 0), 0);
  const totalLastYear = expenseData.reduce((sum, item) => sum + item.lastYear, 0);
  const budgetVariance = totalBudget - totalActual; // Positive = under budget, Negative = over budget
  const yearOverYearGrowth = totalLastYear > 0 ? ((totalActual - totalLastYear) / totalLastYear * 100).toFixed(1) : 0;

  const getVarianceColor = (variance) => {
    if (variance > 0) return 'text-green-600'; // Under budget (good)
    if (variance < 0) return 'text-red-600'; // Over budget (bad)
    return 'text-gray-600';
  };

  const getVarianceIcon = (variance) => {
    if (variance > 0) return <TrendingDown className="w-4 h-4" />; // Under budget (spending less)
    if (variance < 0) return <TrendingUp className="w-4 h-4" />; // Over budget (spending more)
    return null;
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₹ 0';
    return `₹ ${amount.toLocaleString('en-IN')}`;
  };

  const handleExport = () => {
    try {
      // Prepare CSV data
      const csvRows = [];
      
      // Add header
      csvRows.push(['Category', 'Budget (Limit)', 'Actual Spent', 'Remaining', 'Variance', 'Status'].join(','));
      
      // Add expense data
      expenseData.forEach(item => {
        const displayBudget = selectedPeriod === 'month' ? item.budget : item.budget * 12;
        const displayActual = selectedPeriod === 'month' ? item.actual : item.actual * 12;
        const displayRemaining = selectedPeriod === 'month' ? item.remaining : item.remaining * 12;
        const displayVariance = selectedPeriod === 'month' ? item.variance : item.variance * 12;
        
        const status = item.budget === 0 
          ? 'No Budget'
          : item.actual >= item.budget
          ? 'Over Budget'
          : (item.actual / item.budget) >= 0.9
          ? 'Near Limit'
          : 'Within Budget';
        
        csvRows.push([
          `"${item.category}"`,
          displayBudget.toFixed(2),
          displayActual.toFixed(2),
          displayRemaining.toFixed(2),
          displayVariance.toFixed(2),
          `"${status}"`
        ].join(','));
      });
      
      // Add summary section
      csvRows.push('');
      csvRows.push(['Summary', 'Amount'].join(','));
      csvRows.push([`Total Expenses (${selectedPeriod === 'month' ? 'Monthly' : 'Yearly'})`, 
        selectedPeriod === 'month' ? totalActual.toFixed(2) : (totalActual * 12).toFixed(2)].join(','));
      csvRows.push([`Total Budget (${selectedPeriod === 'month' ? 'Monthly' : 'Yearly'})`, 
        selectedPeriod === 'month' ? totalBudget.toFixed(2) : (totalBudget * 12).toFixed(2)].join(','));
      csvRows.push([`Budget Remaining`, 
        selectedPeriod === 'month' ? totalRemaining.toFixed(2) : (totalRemaining * 12).toFixed(2)].join(','));
      csvRows.push([`Budget Variance`, budgetVariance.toFixed(2)].join(','));
      csvRows.push([`Year over Year Growth`, `${yearOverYearGrowth}%`].join(','));
      
      // Create CSV content
      const csvContent = csvRows.join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `expense-analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      successMsg.textContent = 'Analytics data exported successfully!';
      document.body.appendChild(successMsg);
      setTimeout(() => {
        document.body.removeChild(successMsg);
      }, 3000);
    } catch (err) {
      console.error('Error exporting data:', err);
      const errorMsg = document.createElement('div');
      errorMsg.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
      errorMsg.textContent = 'Failed to export data. Please try again.';
      document.body.appendChild(errorMsg);
      setTimeout(() => {
        document.body.removeChild(errorMsg);
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchAnalyticsData}
              className="mt-2 text-sm text-red-700 underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (expenseData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No expense data available for analytics.</p>
            <p className="text-gray-400 text-sm mt-2">Start adding expenses to see analytics.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detailed Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive expense analysis and insights</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2">
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedPeriod === 'month'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedPeriod('year')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedPeriod === 'year'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Yearly
              </button>
            </div>
            <button 
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6 bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Understanding the Terms:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-800">Budget:</span>
              <span className="text-gray-600 ml-2">Spending limit you set (Monthly/Yearly)</span>
            </div>
            <div>
              <span className="font-medium text-gray-800">Actual Spent:</span>
              <span className="text-gray-600 ml-2">Where your money actually went</span>
            </div>
            <div>
              <span className="font-medium text-gray-800">Variance:</span>
              <span className="text-gray-600 ml-2">Budget - Actual (positive = under budget)</span>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses ({selectedPeriod === 'month' ? 'Monthly' : 'Yearly'})</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedPeriod === 'month' ? totalActual : totalActual * 12)}</p>
                <p className="text-xs text-gray-500 mt-1">Where money went</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <IndianRupee className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className={`flex items-center ${yearOverYearGrowth > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {yearOverYearGrowth > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {Math.abs(yearOverYearGrowth)}% vs last year
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Budget ({selectedPeriod === 'month' ? 'Monthly' : 'Yearly'})</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedPeriod === 'month' ? totalBudget : totalBudget * 12)}</p>
                <p className="text-xs text-gray-500 mt-1">Spending limit set</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className={`${getVarianceColor(budgetVariance)}`}>
                {getVarianceIcon(budgetVariance)}
                {budgetVariance >= 0 ? 'Under' : 'Over'} by {formatCurrency(Math.abs(budgetVariance))}
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Budget Remaining</p>
                <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(selectedPeriod === 'month' ? totalRemaining : totalRemaining * 12)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Budget - Spent</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Eye className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${(totalActual / totalBudget) > 1 ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min((totalActual / totalBudget) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(1) : 0}% of budget used
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Top Category</p>
                <p className="text-2xl font-bold text-gray-900">
                  {expenseData.length > 0 ? expenseData[0].category : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {expenseData.length > 0 && formatCurrency(expenseData[0].actual)} ({expenseData[0].percentage}%)
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top 5 Expense Sources */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Top 5 Expense Categories</h2>
            <p className="text-sm text-gray-500 mb-6">Budget vs Actual Spent ({selectedPeriod === 'month' ? 'Monthly' : 'Yearly'})</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseData.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'budget') return [formatCurrency(value), 'Budget (Limit)'];
                    if (name === 'actual') return [formatCurrency(value), 'Actual Spent'];
                    return [formatCurrency(value), name];
                  }} 
                />
                <Bar dataKey="budget" fill="#10B981" name="Budget (Limit)" />
                <Bar dataKey="actual" fill="#3B82F6" name="Actual Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Monthly Expense Trends</h2>
            <p className="text-sm text-gray-500 mb-6">Actual spending over time</p>
            {monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Actual Spent']} />
                  <Area type="monotone" dataKey="actual" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Actual Spent" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No monthly trend data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Expense by Category Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Expense by Category</h2>
            <p className="text-sm text-gray-500 mb-6">Distribution of spending</p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={categoryColors[entry.name] || '#8884d8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Performance */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Category Performance</h2>
            <p className="text-sm text-gray-500 mb-6">Budget vs Actual comparison ({selectedPeriod === 'month' ? 'Monthly' : 'Yearly'})</p>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {expenseData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: categoryColors[item.category] || '#8884d8' }}
                    ></div>
                    <div>
                      <p className="font-medium text-gray-900">{item.category}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Budget (Limit)</p>
                      <p className="font-medium text-gray-900">{formatCurrency(selectedPeriod === 'month' ? item.budget : item.budget * 12)}</p>
                      <p className="text-xs text-gray-500 mt-1">Actual Spent</p>
                      <p className="font-medium text-blue-600">{formatCurrency(selectedPeriod === 'month' ? item.actual : item.actual * 12)}</p>
                      {item.remaining !== undefined && (
                        <>
                          <p className="text-xs text-gray-500 mt-1">Remaining</p>
                          <p className={`font-medium ${item.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(selectedPeriod === 'month' ? item.remaining : item.remaining * 12)}
                          </p>
                        </>
                      )}
                    </div>
                    <div className={`flex flex-col items-center space-y-1 ${getVarianceColor(item.variance)}`}>
                      {getVarianceIcon(item.variance)}
                      <span className="text-sm font-medium">
                        {item.variance >= 0 ? 'Under' : 'Over'}
                      </span>
                      <span className="text-xs">
                        {Math.abs(item.variancePercentage).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Expense Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Detailed Expense Breakdown ({selectedPeriod === 'month' ? 'Monthly' : 'Yearly'})</h2>
            <p className="text-sm text-gray-500 mt-1">Budget (Limit) vs Actual Spent vs Remaining</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget (Limit)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Spent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenseData.map((item, index) => {
                  const displayBudget = selectedPeriod === 'month' ? item.budget : item.budget * 12;
                  const displayActual = selectedPeriod === 'month' ? item.actual : item.actual * 12;
                  const displayRemaining = selectedPeriod === 'month' ? item.remaining : item.remaining * 12;
                  const displayVariance = selectedPeriod === 'month' ? item.variance : item.variance * 12;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-3" 
                            style={{ backgroundColor: categoryColors[item.category] || '#8884d8' }}
                          ></div>
                          <span className="text-sm font-medium text-gray-900">{item.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(displayBudget)}
                        <span className="text-xs text-gray-500 block">Spending Limit</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(displayActual)}
                        <span className="text-xs text-gray-500 block">Where money went</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${displayRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(displayRemaining)}
                        </span>
                        <span className="text-xs text-gray-500 block">Budget - Spent</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          displayVariance >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {displayVariance >= 0 ? '+' : ''}{formatCurrency(displayVariance)}
                          <span className="ml-1">
                            ({displayVariance >= 0 ? 'Under' : 'Over'} Budget)
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.budget > 0 && (item.actual / item.budget) >= 1
                            ? 'bg-red-100 text-red-800'
                            : item.budget > 0 && (item.actual / item.budget) >= 0.9
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.budget === 0 
                            ? 'No Budget'
                            : item.actual >= item.budget
                            ? 'Over Budget'
                            : (item.actual / item.budget) >= 0.9
                            ? 'Near Limit'
                            : 'Within Budget'
                          }
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseAnalytics;
