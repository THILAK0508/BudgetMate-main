// API configuration and utility functions
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle non-JSON responses
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || 'An error occurred');
    }

    if (!response.ok) {
      // If unauthorized, clear token and redirect to login
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        // Only redirect if not already on login/signup page
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
          window.location.href = '/login';
        }
      }
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  } catch (error) {
    // Don't log network errors as errors if backend might be down
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      console.warn('API request failed - backend may be down:', error.message);
    } else {
      console.error('API Error:', error);
    }
    throw error;
  }
};

// API methods
export const api = {
  // Auth
  login: (email, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signup: (userData) =>
    apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  getProfile: () => apiRequest('/auth/profile'),

  // Dashboard
  getDashboardOverview: (period = 'month') =>
    apiRequest(`/dashboard/overview?period=${period}`),

  getQuickStats: () => apiRequest('/dashboard/quick-stats'),

  getActivityFeed: (limit = 20) =>
    apiRequest(`/dashboard/activity-feed?limit=${limit}`),

  // Budgets
  getBudgets: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/budgets?${queryParams}`);
  },

  createBudget: (budgetData) =>
    apiRequest('/budgets', {
      method: 'POST',
      body: JSON.stringify(budgetData),
    }),

  updateBudget: (id, budgetData) =>
    apiRequest(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(budgetData),
    }),

  deleteBudget: (id) =>
    apiRequest(`/budgets/${id}`, {
      method: 'DELETE',
    }),

  getBudgetSummary: () => apiRequest('/budgets/summary/overview'),

  // Expenses
  getExpenses: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/expenses?${queryParams}`);
  },

  createExpense: (expenseData) =>
    apiRequest('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    }),

  updateExpense: (id, expenseData) =>
    apiRequest(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    }),

  deleteExpense: (id) =>
    apiRequest(`/expenses/${id}`, {
      method: 'DELETE',
    }),

  getExpenseSummary: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/expenses/summary/overview?${queryParams}`);
  },

  // Savings
  getSavingsSummary: () => apiRequest('/savings/summary'),

  getIncomes: () => apiRequest('/savings/income'),

  createIncome: (incomeData) =>
    apiRequest('/savings/income', {
      method: 'POST',
      body: JSON.stringify(incomeData),
    }),

  updateIncome: (id, incomeData) =>
    apiRequest(`/savings/income/${id}`, {
      method: 'PUT',
      body: JSON.stringify(incomeData),
    }),

  deleteIncome: (id) =>
    apiRequest(`/savings/income/${id}`, {
      method: 'DELETE',
    }),

  getSavingsExpenses: () => apiRequest('/savings/expenses'),

  createSavingsExpense: (expenseData) =>
    apiRequest('/savings/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    }),

  updateSavingsExpense: (id, expenseData) =>
    apiRequest(`/savings/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    }),

  deleteSavingsExpense: (id) =>
    apiRequest(`/savings/expenses/${id}`, {
      method: 'DELETE',
    }),

  getSavingsBudget: () => apiRequest('/savings/budget'),

  setSavingsBudget: (monthlyBudget) =>
    apiRequest('/savings/budget', {
      method: 'POST',
      body: JSON.stringify({ monthlyBudget }),
    }),

  // Subscriptions
  getSubscriptions: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/subscriptions?${queryParams}`);
  },

  createSubscription: (subscriptionData) =>
    apiRequest('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    }),

  updateSubscription: (id, subscriptionData) =>
    apiRequest(`/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subscriptionData),
    }),

  deleteSubscription: (id) =>
    apiRequest(`/subscriptions/${id}`, {
      method: 'DELETE',
    }),

  getSubscriptionSummary: () => apiRequest('/subscriptions/summary/overview'),

  // Analytics
  createAnalytics: (analyticsData) =>
    apiRequest('/analytics', {
      method: 'POST',
      body: JSON.stringify(analyticsData),
    }),

  getAnalytics: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/analytics?${queryParams}`);
  },

  getAnalyticsSummary: (year) =>
    apiRequest(`/analytics/summary${year ? `?year=${year}` : ''}`),

  getAnalyticsTrends: (years = 3) =>
    apiRequest(`/analytics/trends?years=${years}`),
};

export default api;

