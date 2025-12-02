import { useState, useEffect } from 'react';
import { Search, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Beneficiary } from '../types';

export default function BeneficiaryList() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  const loadBeneficiaries = async () => {
    try {
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBeneficiaries(data || []);
    } catch (error) {
      console.error('Error loading beneficiaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBeneficiaries = beneficiaries.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.card_number.includes(searchTerm)
  );

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">All Beneficiaries</h2>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or card number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Card Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registered
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBeneficiaries.map((beneficiary) => (
              <tr key={beneficiary.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {beneficiary.card_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{beneficiary.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {beneficiary.phone || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {beneficiary.address || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      beneficiary.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : beneficiary.status === 'suspended'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {beneficiary.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(beneficiary.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredBeneficiaries.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No beneficiaries found
        </div>
      )}
    </div>
  );
}
