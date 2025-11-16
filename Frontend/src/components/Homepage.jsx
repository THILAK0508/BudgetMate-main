import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, TrendingUp, Shield, PieChart, Wallet, BarChart3, CreditCard, Target, Calendar, DollarSign } from 'lucide-react';

const Homepage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="relative z-20 border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-4 sm:py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-semibold text-neutral-900 tracking-tight">BudgetMate</span>
            </div>
            
            {isAuthenticated ? (
              <Link to="/dashboard">
                <button className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors">
                  Go to Dashboard
                </button>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <button className="px-6 py-2.5 bg-white text-neutral-700 border border-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors">
                    Login
                  </button>
                </Link>
                <Link to="/signup">
                  <button className="px-6 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors">
                    Sign Up
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-50/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-50/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 py-16 sm:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium mb-6">
                <Shield className="w-4 h-4" />
                <span>Free to use • No credit card required</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 leading-tight tracking-tight">
                Take control of your
                <span className="text-blue-700"> finances</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-neutral-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Manage expenses, track budgets, and build savings with clarity and confidence. 
                Simple tools for better financial decisions.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                {isAuthenticated ? (
                  <Link to="/dashboard">
                    <button className="group px-8 py-3.5 bg-neutral-900 text-white rounded-lg text-base font-medium hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                      Go to Dashboard
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login">
                      <button className="px-8 py-3.5 bg-white text-neutral-700 border border-neutral-300 rounded-lg text-base font-medium hover:bg-neutral-50 hover:border-neutral-400 transition-all">
                        Login
                      </button>
                    </Link>
                    <Link to="/signup">
                      <button className="group px-8 py-3.5 bg-neutral-900 text-white rounded-lg text-base font-medium hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                        Sign Up
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </Link>
                  </>
                )}
              </div>

              {/* Key Features List */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-neutral-700">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-base">Track every expense with detailed categorization</span>
                </div>
                <div className="flex items-center gap-3 text-neutral-700">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-base">Set monthly budgets and monitor spending in real-time</span>
                </div>
                <div className="flex items-center gap-3 text-neutral-700">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-base">Plan savings goals and track progress automatically</span>
                </div>
                <div className="flex items-center gap-3 text-neutral-700">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  <span className="text-base">Manage subscriptions and recurring payments</span>
                </div>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <div className="px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700">
                  <span className="font-medium">Expense Tracking</span>
                </div>
                <div className="px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700">
                  <span className="font-medium">Budget Planning</span>
                </div>
                <div className="px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700">
                  <span className="font-medium">Savings Goals</span>
                </div>
                <div className="px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700">
                  <span className="font-medium">Analytics & Reports</span>
                </div>
              </div>
            </div>

            {/* Right Content - Enhanced Dashboard Preview */}
            <div className="relative">
              <div className="bg-white rounded-xl border border-neutral-200 shadow-lg p-6 sm:p-8 max-w-md mx-auto">
                {/* Dashboard Header */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-base font-semibold text-neutral-900">BudgetMate</span>
                  </div>
                  <div className="w-6 h-6 bg-neutral-200 rounded-full"></div>
                </div>

                {/* Welcome Message */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    Financial Overview
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    Your complete financial dashboard at a glance.
                  </p>
                </div>

                {/* Enhanced Stats Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="text-xs text-neutral-500 mb-1.5 font-medium">Total Budget</div>
                    <div className="text-xl font-bold text-neutral-900 mb-1">₹6,500</div>
                    <div className="text-xs text-neutral-500">This month</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-xs text-blue-600 mb-1.5 font-medium">Total Spent</div>
                    <div className="text-xl font-bold text-blue-700 mb-1">₹3,400</div>
                    <div className="text-xs text-blue-600">52% of budget</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="text-xs text-green-600 mb-1.5 font-medium">Monthly Savings</div>
                    <div className="text-xl font-bold text-green-700 mb-1">₹3,100</div>
                    <div className="text-xs text-green-600">On track</div>
                  </div>
                  <div className="p-4 bg-teal-50 rounded-lg border border-teal-100">
                    <div className="text-xs text-teal-600 mb-1.5 font-medium">Remaining</div>
                    <div className="text-xl font-bold text-teal-700 mb-1">₹3,100</div>
                    <div className="text-xs text-teal-600">Available</div>
                  </div>
                </div>

                {/* Budget Status Bar */}
                <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700">Budget Status</span>
                    <span className="text-sm font-semibold text-green-700">Within Limit</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2 mb-1">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '52%'}}></div>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>₹0</span>
                    <span>₹6,500</span>
                  </div>
                </div>

                {/* Chart Area */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-neutral-900">Monthly Spending</h4>
                    <span className="text-xs text-neutral-500">Last 4 weeks</span>
                  </div>
                  <div className="flex items-end gap-2 h-24 mb-3">
                    <div className="flex-1 bg-neutral-200 rounded-t" style={{height: '45%'}}></div>
                    <div className="flex-1 bg-blue-200 rounded-t" style={{height: '60%'}}></div>
                    <div className="flex-1 bg-teal-200 rounded-t" style={{height: '75%'}}></div>
                    <div className="flex-1 bg-green-200 rounded-t" style={{height: '100%'}}></div>
                    <div className="flex-1 bg-neutral-200 rounded-t" style={{height: '55%'}}></div>
                    <div className="flex-1 bg-blue-200 rounded-t" style={{height: '80%'}}></div>
                    <div className="flex-1 bg-teal-200 rounded-t" style={{height: '65%'}}></div>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>Week 1</span>
                    <span>Week 2</span>
                    <span>Week 3</span>
                    <span>Week 4</span>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-neutral-900 mb-4">Top Categories</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-sm text-neutral-700">Food & Dining</span>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">₹1,200</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <span className="text-sm text-neutral-700">Transport</span>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">₹800</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-teal-600 rounded-full"></div>
                        <span className="text-sm text-neutral-700">Entertainment</span>
                      </div>
                      <span className="text-sm font-semibold text-neutral-900">₹600</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-900 mb-4">Recent Transactions</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-4 h-4 text-blue-700" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-neutral-900">Grocery Shopping</div>
                          <div className="text-xs text-neutral-500">Today • Food</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-neutral-900">₹1,200</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Shield className="w-4 h-4 text-green-700" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-neutral-900">Savings Deposit</div>
                          <div className="text-xs text-neutral-500">Yesterday • Savings</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-700">+₹5,000</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative bg-white border-t border-neutral-200 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Everything you need to manage money
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Simple, powerful tools designed to help you understand and control your finances.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 bg-neutral-50 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <PieChart className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Track Expenses</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Record and categorize every expense. Get clear insights into where your money goes.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-neutral-50 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-700" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Budget Planning</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Set spending limits and track progress. Stay on budget with real-time updates.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-neutral-50 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-teal-700" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Savings Goals</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Plan your savings, track progress, and achieve your financial goals faster.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-neutral-50 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors">
              <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-neutral-700" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Analytics</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Visualize spending patterns with detailed charts and comprehensive reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative bg-neutral-50 border-t border-neutral-200 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              How it works
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Get started in minutes and take control of your finances.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Create Account</h3>
              <p className="text-sm text-neutral-600">
                Sign up for free in seconds. No credit card required.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Add Your Data</h3>
              <p className="text-sm text-neutral-600">
                Input your income, expenses, and set your budgets.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Track & Save</h3>
              <p className="text-sm text-neutral-600">
                Monitor your spending and watch your savings grow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-neutral-900" />
              </div>
              <span className="text-base font-semibold text-white">BudgetMate</span>
            </div>
            <p className="text-sm text-neutral-500">
              © 2025 BudgetMate. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
