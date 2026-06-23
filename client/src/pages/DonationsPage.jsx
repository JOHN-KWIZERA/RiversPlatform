import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import { donationApi } from '../lib/api';
import { formatCurrency, timeAgo, statusColor } from '../lib/utils';
import toast from 'react-hot-toast';

export default function DonationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    donationApi.getMy()
      .then(data => setDonations(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load donations.'))
      .finally(() => setLoading(false));
  }, []);

  const total = donations
    .filter(d => d.status === 'completed')
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-header">{t('dashboard.donations') || 'My Donations'}</h1>
          <p className="text-sm text-gray-500 mt-1">Your full donation history.</p>
        </div>
        {donations.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Total given</p>
            <p className="text-xl font-black text-brand-600">{formatCurrency(total)}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size={28} className="text-brand-500" />
        </div>
      ) : donations.length === 0 ? (
        <div className="card p-16 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-md bg-brand-50 flex items-center justify-center">
            <Heart size={28} className="text-brand-300" />
          </div>
          <h3 className="font-bold text-[#001E2B]">No donations yet</h3>
          <p className="text-sm text-gray-400">Browse campaigns and make your first contribution.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Campaign</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {donations.map((d) => (
                <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      className="text-left font-medium text-[#001E2B] hover:text-brand-600 transition-colors flex items-center gap-1 group"
                      onClick={() => d.campaignId?._id && navigate(`/campaigns/${d.campaignId._id}`)}
                    >
                      {d.campaignId?.title || 'Campaign'}
                      <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    {d.message && <p className="text-xs text-gray-400 mt-0.5 italic">"{d.message}"</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">
                    {timeAgo(d.donatedAt || d.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${statusColor(d.status === 'completed' ? 'completed_donation' : d.status)}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-brand-600">
                    {formatCurrency(d.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
