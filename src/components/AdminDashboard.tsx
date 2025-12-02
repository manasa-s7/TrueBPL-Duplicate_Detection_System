import { useState, useEffect } from 'react';
import { Users, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Beneficiary, DashboardStats } from '../types';
import BeneficiaryRegistration from './BeneficiaryRegistration';
import BeneficiaryList from './BeneficiaryList';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_beneficiaries: 0,
    active_beneficiaries: 0,
    total_transactions: 0,
    flagged_transactions: 0,
    pending_alerts: 0,
    critical_alerts: 0,
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'register' | 'beneficiaries'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const { count: totalBeneficiaries } = await supabase
        .from('beneficiaries')
        .select('*', { count: 'exact', head: true });

      const { count: activeBeneficiaries } = await supabase
        .from('beneficiaries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: totalTransactions } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      const { count: flaggedTransactions } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'flagged');

      const { count: pendingAlerts } = await supabase
        .from('duplicate_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: criticalAlerts } = await supabase
        .from('duplicate_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'critical')
        .eq('status', 'pending');

      setStats({
        total_beneficiaries: totalBeneficiaries || 0,
        active_beneficiaries: activeBeneficiaries || 0,
        total_transactions: totalTransactions || 0,
        flagged_transactions: flaggedTransactions || 0,
        pending_alerts: pendingAlerts || 0,
        critical_alerts: criticalAlerts || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Beneficiaries',
      value: stats.total_beneficiaries,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Beneficiaries',
      value: stats.active_beneficiaries,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Total Transactions',
      value: stats.total_transactions,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      title: 'Pending Alerts',
      value: stats.pending_alerts,
      icon: AlertTriangle,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              BPL Card Duplicate Detection System
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'register'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Register Beneficiary
            </button>
            <button
              onClick={() => setActiveTab('beneficiaries')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'beneficiaries'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Beneficiaries
            </button>
          </nav>
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat) => (
                <div key={stat.title} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {loading ? '...' : stat.value}
                      </p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {stats.critical_alerts > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">
                      Critical Alerts Require Attention
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                      You have {stats.critical_alerts} critical alert(s) pending review.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'register' && <BeneficiaryRegistration onSuccess={loadStats} />}

        {activeTab === 'beneficiaries' && <BeneficiaryList />}
      </div>
    </div>
  );
}
