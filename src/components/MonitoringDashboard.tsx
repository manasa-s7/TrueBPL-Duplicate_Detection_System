import { useState, useEffect } from 'react';
import { AlertTriangle, Activity, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Transaction, DuplicateAlert } from '../types';

export default function MonitoringDashboard() {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<DuplicateAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*, beneficiaries(name, card_number), ration_shops(name, shop_code)')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: alerts } = await supabase
        .from('duplicate_alerts')
        .select('*, beneficiaries(name, card_number), ration_shops(name, shop_code)')
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentTransactions(transactions || []);
      setRecentAlerts(alerts || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAlert = async (alertId: string, status: string) => {
    try {
      await supabase
        .from('duplicate_alerts')
        .update({
          status,
          reviewed_by: 'Admin',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      loadData();
    } catch (error) {
      console.error('Error reviewing alert:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'flagged':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-white">Real-Time Monitoring</h1>
            <p className="mt-2 text-sm text-green-100">
              Live tracking of transactions and duplicate detection alerts
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <TrendingUp className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Live
              </span>
            </div>

            <div className="space-y-4">
              {recentTransactions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No transactions yet</p>
              ) : (
                recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.beneficiaries?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Card: {transaction.card_number}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(transaction.created_at).toLocaleString()}
                      </span>
                    </div>
                    {transaction.ration_shops && (
                      <p className="text-sm text-gray-600 mt-2">
                        Shop: {transaction.ration_shops.name}
                      </p>
                    )}
                    {transaction.face_match_confidence && (
                      <p className="text-sm text-gray-600">
                        Confidence: {transaction.face_match_confidence.toFixed(1)}%
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                <h2 className="text-xl font-bold text-gray-900">Duplicate Alerts</h2>
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                {recentAlerts.filter((a) => a.status === 'pending').length} Pending
              </span>
            </div>

            <div className="space-y-4">
              {recentAlerts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No alerts detected</p>
              ) : (
                recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`border-2 rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {alert.alert_type.replace(/_/g, ' ').toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">{alert.description}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          alert.severity === 'critical'
                            ? 'bg-red-200 text-red-900'
                            : alert.severity === 'high'
                            ? 'bg-orange-200 text-orange-900'
                            : 'bg-yellow-200 text-yellow-900'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-gray-700">
                      {alert.beneficiaries && (
                        <p>Beneficiary: {alert.beneficiaries.name}</p>
                      )}
                      <p>Card: {alert.card_number}</p>
                      {alert.ration_shops && <p>Shop: {alert.ration_shops.name}</p>}
                      <p className="flex items-center text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>

                    {alert.status === 'pending' && (
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => handleReviewAlert(alert.id, 'resolved')}
                          className="flex-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleReviewAlert(alert.id, 'dismissed')}
                          className="flex-1 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}

                    {alert.status !== 'pending' && (
                      <div className="mt-3">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                            alert.status === 'resolved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {alert.status.toUpperCase()}
                        </span>
                        {alert.reviewed_by && (
                          <span className="ml-2 text-xs text-gray-600">
                            by {alert.reviewed_by}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
