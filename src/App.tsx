import { useState } from 'react';
import { Users, ShoppingCart, Activity, Home } from 'lucide-react';
import AdminDashboard from './components/AdminDashboard';
import OperatorDashboard from './components/OperatorDashboard';
import MonitoringDashboard from './components/MonitoringDashboard';

type View = 'home' | 'admin' | 'operator' | 'monitoring';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');

  const renderView = () => {
    switch (currentView) {
      case 'admin':
        return <AdminDashboard />;
      case 'operator':
        return <OperatorDashboard />;
      case 'monitoring':
        return <MonitoringDashboard />;
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="text-center mb-16">
                <h1 className="text-5xl font-bold text-gray-900 mb-4">
                  BPL Card Duplicate Detection System
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Real-time face recognition and cloud-based verification system to
                  prevent duplicate ration distributions
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <button
                  onClick={() => setCurrentView('admin')}
                  className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Admin Dashboard
                  </h2>
                  <p className="text-gray-600">
                    Register beneficiaries, manage database, and view system statistics
                  </p>
                </button>

                <button
                  onClick={() => setCurrentView('operator')}
                  className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Ration Shop Operator
                  </h2>
                  <p className="text-gray-600">
                    Verify beneficiary identity using face recognition at distribution
                    centers
                  </p>
                </button>

                <button
                  onClick={() => setCurrentView('monitoring')}
                  className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Real-Time Monitoring
                  </h2>
                  <p className="text-gray-600">
                    Track transactions, view alerts, and monitor duplicate detection
                  </p>
                </button>
              </div>

              <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Key Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-2 rounded-lg mr-4">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Face Recognition
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Advanced AI-powered facial recognition using DeepFace for accurate
                        identity verification
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-green-100 p-2 rounded-lg mr-4">
                      <ShoppingCart className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Duplicate Prevention
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Automatically detect and flag duplicate attempts across multiple
                        locations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-orange-100 p-2 rounded-lg mr-4">
                      <Activity className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Real-Time Alerts
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Instant notifications for suspicious activities and fraud attempts
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-teal-100 p-2 rounded-lg mr-4">
                      <Activity className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Cloud Sync
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Synchronized database across all ration shops with Supabase
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      {currentView !== 'home' && (
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center px-4 py-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </button>
        </div>
      )}
      {renderView()}
    </div>
  );
}

export default App;
